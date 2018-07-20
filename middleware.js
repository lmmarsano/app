'use strict'
const path = require('path')
    , compose = require('koa-compose')
    , views = require('koa-views')
    , c2k = require('koa-connect')
    , postcss = require('postcss-middleware')
    , sugarss = require('sugarss')
    , comment = require('postcss-discard-comments')
    , precss = require('precss')
    , rucksack = require('rucksack-css')
    , cssnano = require('cssnano')
    , {servePath} = require('./config')
    , postcssSrc = (base) => (req) => {
	    const {dir, name} = path.posix.parse(req.url)
	    return path
	           .join( base
	                , path.normalize(dir)
	                , [name, 'sss'].join('.')
	                )
    }
    , renderer = (__dirname, isDev) => compose
([ views( path.join(__dirname, 'view')
        , { extension: 'pug'
          , map: {pug: 'pug'}
          , options: {cache: !isDev}
            // https://github.com/tj/consolidate.js#caching
          }
        )
 , c2k(postcss({ plugins: [ comment()
                          , rucksack({reporter: true})
                          , precss()
                          , cssnano()
                          ]
               , options: { parser: sugarss
                          , map: true
                          }
               , src: postcssSrc(servePath)
               })
      )
 ])
    , continuer = (app) => {
	    /* intercept expect 100-continue & conditionally retrieve body
	       https://httpwg.org/specs/rfc7231.html#header.expect
	     */
	    const pass = (_, next) => next()
	        , continueWare = (predicate, {withBody = pass, withoutBody = pass} = {}) => async (ctx, next) => {
		    // retrieve body when predicate returns true
		    const {writeContinue} = ctx.response
		    if (!writeContinue || predicate(ctx)) {
			    writeContinue && writeContinue()
			    await withBody(ctx, next)
		    } else {
			    await withoutBody(ctx, next)
		    }
	    }
	        , {listener, createContext} = Object.getPrototypeOf(app)
	    let checkContinue = false
	    // track checkContinue & set context
	    // state preserves across synchronous events in a single thread
	    app.listener = (...args) => {
		    const server = listener.call(app, ...args)
		    server.on( 'checkContinue'
		             , (...args) => {
			             checkContinue = true
			             server.emit('request', ...args)
		             }
		             )
		    return server
	    }
	    // private method may change without warning
	    app.createContext = (req, res) => {
		    const ctx = createContext.call(app, ...arguments)
		    if (checkContinue) {
			    ctx.response.writeContinue = () => res.writeContinue()
			    checkContinue = false
		    }
		    return ctx
	    }
	    return continueWare
    }
module.exports = {renderer, continuer}
