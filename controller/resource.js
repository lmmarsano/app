'use strict'
const debug = require('debug')('app:controller.resource')
    , {validationThrow, toRelative} = require('./helper')
    , {normalizeUrl} = require('../utility')
    , {FileRequiredError} = require('../model/data.schema')
    , controller = ({Container, Resource}, {resource: path}) => {
	    // parameters: models & relative paths between resources
	    const createRead = toRelative(path.create.read)
	        , extractKey = (contentId) => contentId.startsWith('urn:md5:')
	                                   && contentId.substring(8)
	        , fetcher = (ctx) => () => {
		        const {writeContinue} = ctx.state
		        writeContinue && writeContinue()
		        return ctx.state.incoming
	        }
	        , getContainerName = async (ctx, url) => {
		        const nUrl = normalizeUrl(url)
		            , containerName = await Container.findContainerAndName(nUrl)
		                           || ctx.throw( 422 // Unprocessable Entity
		                                       , 'No parent container for URL exists.'
		                                       )
		            , {container} = containerName
		        container.isAuthorized
		        (ctx.session.userId) || ctx.throw( 403 // Forbidden
		                                         , 'Request requires an authorized user.'
		                                         , containerName
		                                         )
		        return containerName
	        }
	        , lookup = async (ctx, next) => {
		        const url = normalizeUrl(ctx.params.url)
		            , container = await Container.findResource
		        ( url
		        , {populate: { path: 'vdata'
		                     , select: { md5: 1
		                               , contentType: 1
		                               }
		                     }
		          }
		        )
		                       || ctx.throw( 404    // Not Found
		                                   , 'Resource not found.'
		                                   )
		            , resource = container.resources[0]
		        Object.assign( ctx.state
		                     , { container
		                       , resource
		                       }
		                     )
		        return next()
	        }
	        , isAuthorized = (ctx, next) => {
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
		        return next()
	        }
	        , create = async (ctx, next) => {
		        const {container, name} = await getContainerName(ctx, ctx.params.url)
		            , data = extractKey(ctx.request.get('content-id'))
		            , raw = Object.assign( { container: container._id
		                                   , name
		                                   }
		                                 , data
		                                 ? {data}
		                                 : null
		                                 )
		        try {
			        const resource = await Resource.add(raw, fetcher(ctx))
			        debug('create resource %O', resource)
			        ctx.response.status = 201 // Created
			        ctx.response.body = resource
		        } catch (e) {
			        if(e instanceof FileRequiredError) {
				        ctx.throw( 422  // Bad Request
				                 , 'Request requires a file.'
				                 , {raw}
				                 )
			        } else {
				        validationThrow(ctx, e, {raw})
			        }
		        }
	        }
	        , read = async (ctx, next) => {
		        const {container, resource} = ctx.state
		            , {vdata} = resource
		        Object.assign
		        ( ctx.response
		        , { type: resource.type
		               || vdata.contentType
		          , body: vdata.getDownloadStream()
		          }
		        )
		        debug( 'read container %s resource %s data %s'
		             , container.url
		             , resource.name
		             , resource.data
		             )
	        }
	        , update = async (ctx, next) => {
		        // content-id destination content-type
		        const {container, resource} = ctx.state
		            , [ destination
		              , contentId
		              , contentType
		              ] = 'destination content-id content-type'
		                  .split(' ')
		                  .map((field) => ctx.request.get(field))
		            , changes = Object.assign
		        ( {}
		        , destination
		       && await getContainerName(ctx, destination)
		        , contentId
		       && {data: extractKey(contentId)}
		        , contentType
		       && {type: contentType}
		        )
		        try {
			        await resource.deepUpdate(changes, fetcher(ctx))
			        ctx.response.body = null
			        debug('update resource %O', resource)
		        } catch (e) {
			        const {method} = ctx.request
			        if(e instanceof FileRequiredError) {
				        ctx.throw( 422  // Bad Request
				                 , 'Request requires a file.'
				                 , {method, contentId}
				                 )
			        } else {
				        validationThrow(ctx, e, {method})
			        }
		        }
	        }
	        , destroy = async (ctx, next) => {
		        const {resource} = ctx.state
		            , {_id} = resource
		        await Resource.removeQuery({_id})
		        ctx.response.body = null
		        debug('destroy resource %O', resource)
	        }
	    return { resource: { create
	                       , read
	                       , update
	                       , delete: destroy
	                       , lookup
	                       , isAuthorized
	                       }
	           }
}
module.exports = controller
