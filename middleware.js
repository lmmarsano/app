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

module.exports = {renderer}
