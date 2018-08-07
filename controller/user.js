'use strict'
const debug = require('debug')('app:controller.user')
    , {validationThrow, isDuplicateError, toRelative} = require('./helper')
    , {UserNotFoundError} = require('../model/user.schema')
    , controller = ({User}, path) => {
	    // parameters: models & relative paths between resources
	    const createRead = toRelative(path.create.read)
	        , authenticate = async (ctx, credential) => {
		        let user
		        try {
			        user = await User.authenticate(credential)
		        } catch (e) {
			        if (e instanceof UserNotFoundError) {
				        user = null
			        } else {
				        validationThrow(ctx, e, {credential})
			        }
		        }
		        ctx.assert( user
		                  , 422     // Unprocessable Entity
		                  , 'Wrong login credentials.'
		                  , {name: credential.name}
		                  )
		        debug('authenticate %O', user)
		        return user
	        }
	        , initUserSession = (user, ctx) => {
		        ctx.session.userId = user._id
		        debug('update session %O', ctx.session)
	        }
	        , login = async (ctx, next) => {
		        const user = await authenticate(ctx, ctx.request.body)
		        initUserSession(user, ctx)
		        ctx.response.body = null
	        }
	        , logout = async (ctx, next) => {
		        debug('clear session %O', ctx.session)
		        ctx.response.body = ctx.session = null
	        }
	        , create = async (ctx, next) => {
		        const {body = {}} = ctx.request
		            , {name} = body
		        delete body._id
		        try {
			        const user = await (new User(body))
			                           .save()
			            , Location = createRead(ctx, {name})
			        debug('create user %O', user)
			        initUserSession(user, ctx)
			        ctx.response.status = 201 // Created
			        ctx.response.set({ Location
			                         , 'Content-Location': Location
			                         })
			        // TODO ETag
			        ctx.response.body = await user.fill()
		        } catch (e) {
			        if (isDuplicateError(e)) {
				        ctx.throw( 400  // Bad Request
				                 , 'Name unavailable.'
				                 , {name}
				                 )
			        } else {
				        validationThrow(ctx, e, {body})
			        }
		        }
	        }
	        , requiresLogin = async (ctx, next) => {
		        const {session} = ctx
		        ctx.assert( session.userId
		                  , 403         // Forbidden
		                  , 'Request requires user authentication.'
		                  , {session}
		                  )
		        debug('authenticated session %O', session)
		        await next()
	        }
	        , read = async (ctx, next) => {
		        const {userId} = ctx.session
		        debug('lookup user ID %s', userId)
		        const user = await User.findById(userId)
		        ctx.assert( ctx.params.name === user.name
		                  , 403         // Forbidden
		                  , 'Request requires an authorized user.'
		                  , {userId, user}
		                  )
		        ctx.response.body = await user.fill()
	        }
	        , list = async (ctx, next) => {
		        debug('lookup users')
		        ctx.response.body = await User.find
		        ( {}
		        , {}
		        , { sort: {name: 1}
			        , lean: true
		          }
		        )
	        }
	        , update = async (ctx, next) => {
		        const {name} = ctx.params
		            , {body} = ctx.request
		            , {password, newPassword} = body || {}
		        ctx.assert( name && password && newPassword
		                  , 422         // Unprocessable Entity
		                  , 'Name, password, and newPassword are required.'
		                  , {name, password, newPassword}
		                  )
		        const user = await authenticate(ctx, {name, password})
		        user.password = newPassword
		        try {
			        await user.save()
			        ctx.response.body = null
			        debug('update user %O', user)
		        } catch (e) {
			        validationThrow(ctx, e, {body})
		        }
	        }
	        , delUser = async (ctx, next) => {
		        const {name} = ctx.params
		            , {password} = ctx.request.body || {}
		        const user = await authenticate(ctx, {name, password})
		        await User.removeQuery({_id: user._id})
		        ctx.response.body = null
	        }
	        , echo = async (ctx, next) => {
		        console.log(ctx.request)
		        ctx.response.body = ctx.request
	        }
	    return { user: { login
	                   , logout
	                   , create
	                   , delete: delUser // verify user credentials
	                   , update
	                   , read
	                   , list
	                   }
	           , requiresLogin
	           }
}
module.exports = controller
