'use strict'
const {default: test} = require('ava')
    , {default: MongodbMemoryServer} = require('mongodb-memory-server')
    , mongoose = require('mongoose')
    , mongod = new MongodbMemoryServer
    , instance = (() => {
	let i = 0
	return () => i++
})()
    , setup = (hooks) => {
	    let port

	    test.before(async () => {
		    port = await mongod.getPort()
	    })

	    test.beforeEach(async (t) => {
		    const connection = await mongoose.createConnection
		    ( `mongodb://localhost:${port}/test${instance()}`
		    , {useNewUrlParser: true}
		    )
		    Object.assign(t.context, {connection})
	    })

	    hooks && hooks()

	    test.afterEach.always(async (t) => {
		    const {connection} = t.context
		    try {
			    await connection.dropDatabase()
			    connection.close()
		    } catch (e) {
			    e.message += `
Failed to drop database & closed connection.`
			    throw e
		    }
	    })

	    test.after.always(async () => {
		    try {
			    await mongoose.disconnect()
			    await mongod.stop()
		    } catch (e) {
			    e.message += `
Failed to stop mongo.`
			    throw e
		    }
	    })
    }

module.exports = {setup, test, mongoose, mongod}
