'use strict'
const URL = require('url')
    , debug = require('debug')('app') // set debug message heading to app
    , {cookieSecret, servePath} = require('./config')
    , Koa = require('koa')
    , logger = require('koa-logger')
    , cors = require('@koa/cors')
    , body = require('koa-body')()
    , etag = require('koa-etag')
    , conditional = require('koa-conditional-get')
    , session = require('koa-session')
    , Router = require('koa-router')
    , MongooseStore = require('koa-session-mongoose')
    , {renderer} = require('./middleware')
    , serve = require('koa-static')
    , apiRouter = require('./route/api')
    , notFound = async (ctx) => ctx.throw(404)
    , init = async (connection) => {
	    const app = new Koa
	        , router = new Router
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
	    // assemble router
	    router
	    .use('/api', apiRouter(connection).routes())

	    // cookie keys
	    app.keys = cookieSecret

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
	                  , store: new MongooseStore({connection})
	                  }
	                , app
	                )
	        )
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
