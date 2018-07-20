'use strict'
const debug = require('debug')('app:controller')
    , pathToRegexp = require('path-to-regexp')
    , {relativeUrl} = require('./utility')
    , toTransform = (url) => {
	    const resolve = pathToRegexp.compile(url)
	    return (ctx, params) => relativeUrl( ctx.request.url
	                                      , resolve(params)
	                                      )
    }
    , controller = ({User}, path) => {
	    // parameters: models & relative paths between resources
	    const createRead = toTransform(path.create.read)
	        , authenticate = async (ctx, name, password) => {
	    	const user = await User.authenticate(name, password)
	    	ctx.assert( user
	    	          , 422         // Unprocessable Entity
	    	          , 'Wrong login credentials.'
	    	          , {name}
		              )
	    	debug('authenticate %O', user)
	    	return user
	    }
	    , normalizeCommand = async (ctx, next) => {
		    const {method, operands = {}} = ctx.request.body
		    Object.assign( ctx.state
		                 , {method, operands}
		                 )
		    await next()
	    }
	    , initUserSession = (user, ctx) => {
		    ctx.session.userId = user._id
		    debug('update session %O', ctx.session)
	    }
	    , login = async (ctx, next) => {
		    const {name, password} = ctx.request.body || {}
		    ctx.assert( name && password
		              , 422         // Unprocessable Entity
		              , 'Name and password are required.'
		              )
		    const user = await authenticate(ctx, name, password)
		    initUserSession(user, ctx)
		    ctx.response.status = 204 // No Content
		    ctx.response.body = null
	    }
	    , logout = async (ctx, next) => {
		    debug('clear session %O', ctx.session)
		    ctx.response.status = 204 // No Content
		    ctx.response.body = ctx.session = null
	    }
	    , create = async (ctx, next) => {
		    const {body = {}} = ctx.request
		        , {name, password} = body
		    ctx.assert( name && password
		              , 422         // Unprocessable Entity
		              , 'Name and password are required.'
		              )
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
			    ctx.response.body = user
		    } catch (err) {
			    ctx.throw( 400        // Bad Request
			             , 'Name unavailable.'
			             , {name}
			             )
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
		    delete user.password
		    ctx.response.body = user
	    }
	    , update = async (ctx, next) => {
		    const {name} = ctx.params
		        , {password, newPassword} = ctx.request.body || {}
		    ctx.assert( name && password && newPassword
		              , 422         // Unprocessable Entity
		              , 'Name, password, and newPassword are required.'
		              , {name, password, newPassword}
		              )
		    const user = await authenticate(ctx, name, password)
		    user.password = newPassword
		    try {
			    await user.save()
			    ctx.response.body = user
			    debug('update user %O', user)
		    } catch (err) {
			    ctx.throw( 400        // Bad Request
			             , 'Password update failed.'
			             , {name}
			             )
		    }
	    }
	    , echo = async (ctx, next) => {
		    console.log(ctx.request)
		    ctx.response.body = ctx.request
	    }
	return { user: { login
	               , logout
	               , create
	               , delete: echo // verify user credentials
	               , update
	               , read
	               }
	       , normalizeCommand
	       , requiresLogin
	       }
}
// app.use((req, res, next) => {
// 	res.locals.currentUser = ctx.request.session.userId
// 	next()
// })
// router.route('/profile')
// .get( mid.requiresLogin
//     , (req, res, next) => {
//     }
//     )
module.exports = controller
