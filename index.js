'use strict'
const URL = require('url')
    , debug = require('debug')('app') // set debug message heading to app
    , {cookieSecret, servePath} = require('./config')
    , Koa = require('koa')
    , logger = require('koa-logger')
    , cors = require('@koa/cors')
    , body = require('koa-body')()
    , session = require('koa-session')
    , Keygrip = require('keygrip')
    , etag = require('koa-etag')
    , conditional = require('koa-conditional-get')
    , Router = require('koa-router')
    , MongooseStore = require('koa-session-mongoose')
    , {renderer} = require('./middleware')
    , serve = require('koa-static')
    , apiRouter = require('./route/api')
    , router = new Router()
    , app = new Koa
    , isDev = app.env === 'development'
    , errorHandler = async (ctx, next) => {
	    try {
		    await next()
	    } catch (err) {
		    err.status = ctx.status
		               = err.statusCode
		              || err.status
		              || 500
		    // provide templates error only in development
		    if (isDev) {
			    ctx.state.error = err
		    }
		    // send error response
		    debug('error %O', err)
		    ctx.body = {...err, message: err.message}
	    }
    }
    , notFound = async (ctx) => ctx.throw(404)
    , tap = { session: async (ctx, next) => {
	    debug('session %O', ctx.session)
	    await next()
    }
            , cookie: async (ctx,next) => {
	            debug('cookie %O', ctx.cookies.get('session'))
	            await next()
            }
            }
    , init = async (mongoose) => {
	    // assemble router
	    router
	    .use('/api', apiRouter().routes())

	    // cookie keys
	    app.keys = new Keygrip(cookieSecret)

	    // name body-parser
	    body._name = 'bodyParser'

	    // mount middleware
	    app
	    .use(errorHandler)
	    .use(logger())
	    .use(cors())
	    .use(etag())
	    .use(conditional())
	    .use(session( { key: 'session'
	                  , store: new MongooseStore({connection: mongoose})
	                  }
	                , app
	                )
	        )
	    .use(tap.session)
	    .use(tap.cookie)
	    .use(body)
	    .use(renderer(__dirname, isDev))
	    .use(serve( servePath
	              , {extensions: 'html css js svg png jpeg'.split(' ')}
	              )
	        )
	    .use(router.routes())
	    // 405 Method Not Allowed & 501 Not Implemented
	    .use(router.allowedMethods())
	    .use(notFound)
	    return app
    }

module.exports = init
