'use strict'
const Router = require('koa-router')
    , model = require('../model')
    , { user: {login, logout, create, delete: delUser, update, read}
      , requiresLogin
      } = require('../controller')(model)
    , apiRouter = (options) => {
	    const userNameRouter = new Router()
	        , userRouter = new Router()
	        , sessionRouter = new Router()
	        , router = new Router(options)
	    userNameRouter
	    .use(requiresLogin)
	    .get('userRead', '/', read)
	    .put('userUpdate', '/', update)
	    .delete('userDelete', '/', delUser)
	    userRouter
	    .post('userCreate', '/', create)
	    .use('/:name', userNameRouter.routes())
	    sessionRouter
	    .post('sessionBegin', '/', login)
	    .delete('sessionEnd', '/', requiresLogin, logout)
	    return router
	           .use('/user', userRouter.routes())
	           .use('/session', sessionRouter.routes())
    }
module.exports = apiRouter
