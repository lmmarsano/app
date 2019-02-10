'use strict'
const debug = require('debug')('app:controller.user')
    , {validationThrow, isDuplicateError, toRelative} = require('./helper')
    , {UserNotFoundError} = require('../model/user.schema')
    , controller = ({User}, {user: path}) => {
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
		        debug('initUserSession %O', ctx.session)
	        }
	        , login = async (ctx, next) => {
		        const user = await authenticate(ctx, ctx.request.body)
		        initUserSession(user, ctx)
		        debug('login')
		        ctx.response.body = null
	        }
	        , logout = async (ctx, next) => {
		        debug('logout session %O', ctx.session)
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
			        user.password = undefined
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
	        , requiresLogin = (ctx, next) => {
		        const {session} = ctx
		        ctx.assert( session.userId
		                  , 403         // Forbidden
		                  , 'Request requires user authentication.'
		                  , {session}
		                  )
		        debug('requiresLogin session %O', session)
		        return next()
	        }
	        , getUser = async (ctx, next) => {
		        const {userId} = ctx.session
		            , {name} = ctx.params
		        const user = ctx.state.user
		                   = await ( userId
		                           ? User.findById(userId)
		                           : User.findOne({name})
		                           )
		        debug('getUser %s', name)
		        return next()
	        }
	        , isAuthorized = (ctx, next) => {
		        const {user} = ctx.state
		        ctx.assert( ctx.params.name === user.name
		                  , 403         // Forbidden
		                  , 'Request requires an authorized user.'
		                  , {user}
		                  )
		        debug('isAuthorized')
		        return next()
	        }
	        , read = async (ctx, next) => {
		        const user = ctx.response.body
		                   = await ctx.state.user.fill()
		        debug('read %O', user)
	        }
	        , update = async (ctx, next) => {
		        const {body} = ctx.request
		            , {user} = ctx.state
		        try {
			        debug('update user %O', await user.safeUpdate(body))
			        ctx.response.body = null
		        } catch (e) {
			        validationThrow(ctx, e, {body})
		        }
	        }
	        , destroy = async (ctx, next) => {
		        await User.removeQuery({_id: ctx.session.userId})
		        debug('destroy %O', ctx.state.user)
		        ctx.response.body = ctx.session = null
	        }
	        , list = async (ctx, next) => {
		        debug('list users')
		        ctx.response.body = await User.find
		        ( {}
		        , {}
		        , { sort: {name: 1}
			        , lean: true
		          }
		        )
	        }
	        , echo = async (ctx, next) => {
		        console.log(ctx.request)
		        ctx.response.body = ctx.req
	        }
	    return { user: { login
	                   , logout
	                   , getUser
	                   , isAuthorized
	                   , create
	                   , read
	                   , update
	                   , delete: destroy
	                   , list
	                   }
	           , requiresLogin
	           }
}
module.exports = controller
