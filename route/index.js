'use strict'
const Router = require('koa-router')
    , body = require('koa-bodyparser')()
    , model = require('../model')
    , controller = require('../controller')
    , decompress = require('../koa-decompress')()
    , router = async (connection, {api: apiOptions, bodyFetch} = {}) => {
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
	        , resourceUrlRouter = new Router
	        , resourceRouter = new Router

	    userNameRouter
	    .use('/', user.getUser)
	    .get('userRead', '/', user.read)
	    .use('/', requiresLogin, user.isAuthorized)
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
	    .use('/', container.lookup)
	    .get('containerRead', '/', container.read)
	    .use('/', requiresLogin, isAuthorized)
	    .put('containerUpdate', '/', container.update)
	    .delete('containerDelete', '/', container.delete)
	    containerRouter
	    .post('containerCreate', '/', requiresLogin, container.create)
	    .use('/:url*', containerUrlRouter.routes())

	    dataRouter
	    .get('dataRead', '/:key', data.read)

	    api
	    .use(bodyFetch(), body)
	    .use('/user', userRouter.routes())
	    .use('/session', sessionRouter.routes())
	    .use('/container', containerRouter.routes())
	    .use('/data', dataRouter.routes())

	    resourceUrlRouter
	    .post('resourceCreate', '/', requiresLogin, decompress, resource.create)
	    .use('/', resource.lookup)
	    .get('resourceRead', '/', resource.read)
	    .use('/', requiresLogin, isAuthorized)
	    .put('resourceUpdate', '/', decompress, resource.update)
	    .delete('resourceDelete', '/', resource.delete)
	    resourceRouter
	    .use('/:url*', resourceUrlRouter.routes())

	    return {api, resource: resourceRouter}
    }

// name body-parser
body._name = 'bodyParser'

module.exports = router
