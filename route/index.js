'use strict'
const Router = require('koa-router')
    , body = require('koa-bodyparser')()
    , model = require('../model')
    , controller = require('../controller')
    , router = async (connection, {options: {api: apiOptions} = {}} = {}) => {
	    const { user
	          , container
	          , data
	          , resource
	          , requiresLogin
	          , isAuthorized
	          } = controller( await model(connection)
	                        , { user: {create: {read: ':name'}}
	                          , container: {create: {read: ':url*'}}
	                          }
	                        )
	        , userNameRouter = new Router
	        , userRouter = new Router
	        , sessionRouter = new Router
	        , containerUrlRouter = new Router
	        , containerRouter = new Router
	        , dataRouter = new Router
	        , api = new Router(apiOptions)
	        , resourceRouter = new Router({prefix: '/:url*'})

	    userNameRouter
	    .use(requiresLogin)
	    .get('userRead', '/', user.read)
	    .put('userUpdate', '/', user.update)
	    .delete('userDelete', '/', user.delete)
	    userRouter
	    .get('userList', '/', user.list)
	    .post('userCreate', '/', user.create)
	    .use('/:name', userNameRouter.routes())
	    sessionRouter
	    .post('sessionBegin', '/', user.login)
	    .delete('sessionEnd', '/', requiresLogin, user.logout)

	    containerUrlRouter
	    .use(container.lookup)
	    .get('containerRead', '/', container.read)
	    .use(requiresLogin)
	    .use(isAuthorized)
	    .put('containerUpdate', '/', container.update)
	    .delete('containerDelete', '/', container.delete)
	    containerRouter
	    .post('containerCreate', '/', requiresLogin, isAuthorized, container.create)
	    .use('/:url*', containerUrlRouter.routes())

	    dataRouter
	    .get('dataRead', '/data/:key', data.read)

	    api
	    .use(body)
	    .use('/user', userRouter.routes())
	    .use('/session', sessionRouter.routes())
	    .use('/container', containerRouter.routes())
	    .use('/data', dataRouter.routes())

	    resourceRouter
	    .use(resource.lookup)
	    .get('resourceRead', '/', resource.read)
	    .use(requiresLogin)
	    .use(isAuthorized)
	    .post('resourceCreate', '/', resource.create)
	    .put('resourceUpdate', '/', resource.update)
	    .delete('resourceDelete', '/', resource.delete)

	    return {api, resource: resourceRouter}
    }

// name body-parser
body._name = 'bodyParser'

module.exports = router
