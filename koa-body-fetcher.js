'use strict'
const debug = require('debug')('koa-body-fetcher')
    , bodyFetcher = (app) => {
	/* intercept expect 100-continue & conditionally retrieve body
	   https://httpwg.org/specs/rfc7231.html#header.expect
	 */
	{
		let checkContinue = false
		/* track checkContinue & set context
		   state preserves across synchronous events in a single thread */
		{
			const {listen} = Object.getPrototypeOf(app)
			app.listen = (...args) => {
				const server = listen.apply(app, args)
				               .on( 'checkContinue'
				                  , (...args) => {
					                  debug('checkContinue')
					                  checkContinue = true
					                  server.emit('request', ...args)
				                  }
				                  )
				debug('listen')
				return server
			}
		}
		/* private method may change without warning
		   called in same thread as request handler */
		{
			const {createContext} = Object.getPrototypeOf(app)
			app.createContext = (req, res) => {
				const ctx = createContext.call(app, req, res)
				if (checkContinue) {
					ctx.state.writeContinue = () => {
						res.writeContinue()
						debug('writeContinue')
					}
					checkContinue = false
				}
				return ctx
			}
		}
	}
	{
		const pass = (_, next) => next()
		    , bodyFetch = ( predicate
		                  , { withBody = pass
		                    , withoutBody = pass
		                    } = {}
		                  ) => {
			                  const bodyFetch = (ctx, next) => {
				                  // retrieve body when predicate returns true
				                  const {writeContinue} = ctx.state
				                  if (writeContinue && !predicate(ctx)) {
					                  return withoutBody(ctx, next)
				                  } else {
					                  writeContinue && writeContinue()
					                  return withBody(ctx, next)
				                  }
			                  }
			                      , bodyFetchAlways = (ctx, next) => {
				                      const {writeContinue} = ctx.state
				                      writeContinue && writeContinue()
				                      return next()
			                      }
			                  return predicate
			                       ? bodyFetch
			                       : bodyFetchAlways
		                  }
		return {app, bodyFetch}
	}
}

module.exports = bodyFetcher
