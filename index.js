'use strict'
const URL = require('url')
    , debug = require('debug')('app') // set debug message heading to app
    , {cookieSecret, servePath} = require('./config')
    , Koa = require('koa')
    , bodyFetcher = require('./koa-body-fetcher')
    , logger = require('koa-logger')
    , cors = require('@koa/cors')
    , etag = require('koa-etag')
    , conditional = require('koa-conditional-get')
    , session = require('koa-session')
    , Router = require('koa-router')
    , MongooseStore = require('koa-session-mongoose')
    // , {renderer} = require('./middleware')
    // , serve = require('koa-static')
    , getRouters = require('./route')
    , notFound = async (ctx) => ctx.throw(404)
    , init = async (connection) => {
	    const {app, bodyFetch} = bodyFetcher(new Koa)
	        , always = () => true
	        , router = new Router
	        , {api, resource} = await getRouters(connection, {bodyFetch})
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
	    debug('app.env %s', app.env)
	    // assemble router
	    router
	    .use('/api', api.routes())
	    .use('', resource.routes())

	    // cookie keys
	    app.keys = cookieSecret

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
	    // .use(body)
	    // .use(renderer(__dirname, isDev))
	    // .use(serve( servePath
	    //           , {extensions: 'html css js svg png jpeg'.split(' ')}
	    //           )
	    //     )
	    .use(router.routes())
	    // 405 Method Not Allowed & 501 Not Implemented
	    .use(router.allowedMethods())
	    .use(notFound)
	    return app
    }

module.exports = init
