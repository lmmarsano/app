'use strict'
const debug = require('debug')('koa:body-fetcher')
    , bodyFetcher = (app) => {
	/* intercept expect 100-continue & conditionally retrieve body
	   https://httpwg.org/specs/rfc7231.html#header.expect
	 */
	{
		let checkContinue = false
		/* track checkContinue & set context
		   state preserves across synchronous events in a single thread */
		{
			const {listener} = Object.getPrototypeOf(app)
			app.listener = (...args) => {
				const server = listener.call(app, ...args)
				server.on( 'checkContinue'
				         , (...args) => {
					         checkContinue = true
					         server.emit('request', ...args)
					         debug('checkContinue')
				         }
				         )
				debug('listen')
				return server
			}
		}
		// private method may change without warning
		{
			const {createContext} = Object.getPrototypeOf(app)
			app.createContext = (req, res) => {
				const ctx = createContext.call(app, ...arguments)
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
				                  const {writeContinue} = ctx.response
				                  if (writeContinue && !predicate(ctx)) {
					                  return withoutBody(ctx, next)
				                  } else {
					                  writeContinue && writeContinue()
					                  return withBody(ctx, next)
				                  }
			                  }
			                  return bodyFetch
		                  }
		return {app, bodyFetch}
	}
}

module.exports = bodyFetcher
