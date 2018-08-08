'use strict'
const debug = require('debug')('app:controller.container')
    , {validationThrow, isDuplicateError, toRelative} = require('./helper')
    , {normalizeUrl} = require('../utility')
    , controller = ({Container}, {container: path}) => {
	    // parameters: models & relative paths between resources
	    const createRead = toRelative(path.create.read)
	        , lookup = async (ctx, next) => {
		        const url = normalizeUrl(ctx.params.url)
		            , container = await Container.findOne({url})
		                       || ctx.throw( 404    // Not Found
		                                   , 'Container not found.'
		                                   )
		        debug('lookup %O', container)
		        Object.assign(ctx.state, {container})
		        return next()
	        }
	        , isAuthorized = async (ctx, next) => {
		        ctx
		        .state
		        .container
		        .isAuthorized
		        (ctx.session.userId) || ctx
		                                .throw( 403    // Forbidden
		                                      , 'Request requires an authorized user.'
		                                      , { method: ctx.request.method
		                                        , container: ctx.container.url
		                                        }
		                                      )
		        debug('isAuthorized accepts')
		        return next()
	        }
	        , create = async (ctx, next) => {
		        const {body = {}} = ctx.request
		            , {url} = body
		        delete body._id
		        body.assignedTo = ctx.session.userId
		        try {
			        const container = await (new Container(body))
			                                .save()
			            , Location = createRead(ctx, {url})
			        debug('create %O', container)
			        ctx.response.status = 201 // Created
			        ctx.response.set({ Location
			                         , 'Content-Location': Location
			                         })
			        ctx.response.body = await container.fill()
		        } catch (e) {
			        if (isDuplicateError(e)) {
				        ctx.throw( 400        // Bad Request
				                 , 'Container unavailable.'
				                 , {container: await Container.findOne({url})}
				                 )
			        } else {
				        validationThrow(ctx, e, {body})
			        }
		        }
	        }
	        , read = async (ctx, next) => {
		        const {container} = ctx.state
		        debug('read container %s', container.url)
		        ctx.response.body = await container.fill()
	        }
	        , update = async (ctx, next) => {
		        const {container} = ctx.state
		            , {body} = ctx.request
		            , {_id} = body
		        container.hasId
		        (_id) || ctx.throw( 422    // Unprocessable Entity
		                          , '_id does not match container.'
		                          , {_id, url: container.url}
		                          )
		        delete body._id
		        try {
			        await Object.assign(container, body).save()
			        debug('update container %O', container)
			        ctx.response.body = null
		        } catch (e) {
			        validationThrow(ctx, e, {body})
		        }
	        }
	        , destroy = async (ctx, next) => {
		        const {_id, url} = ctx.state.container
		        await Container.removeQuery({_id})
		        debug('destroy container %s', url)
		        ctx.response.body = null
	        }
	    return { container: { create
	                        , read
	                        , update
	                        , delete: destroy
	                        , lookup
	                        }
	           , isAuthorized
	           }
}
module.exports = controller
