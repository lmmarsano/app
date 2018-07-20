'use strict'
import test from 'ava'
import url from 'url'
import request from 'supertest'
import MongodbMemoryServer from 'mongodb-memory-server'
import mongoose from 'mongoose'

import init from '.'

const mongod = new MongodbMemoryServer
    , instance = (() => {
	let i = 0
	return () => i++
})()
    , tap = (value) => {
	console.error('trace', value)
	return value
}
let port

test.before(async () => {
	port = await mongod.getPort()
})

test.beforeEach(async (t) => {
	const {context} = t
	    , connection = context.connection
	                 = await mongoose.createConnection
	( tap(`mongodb://localhost:${port}/test${instance()}`)
	, {useNewUrlParser: true}
	)
	    , app = await init(connection)
	    , client = request.agent(app.listen())
	    , uri = '/api/user'
	    , userCreate = { uri
	                   , request: client
	                              .post(uri)
	                              .send({ name: 'user'
	                                    , password: 'password'
	                                    })
	                   }
	Object.assign(context, {client, userCreate})
})

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
		await mongod.stop()
	} catch (e) {
		e.message += `
Failed to stop mongo.`
		throw e
	}
})

test
( 'app persists authenticated session'
, async (t) => {
	const {client, userCreate} = t.context
	    , responseCreate = await userCreate.request
	t.regex( ( responseCreate
	           .header['set-cookie']
	        || []
	         )
	         .join(`
`)
	       , /session/
	       )
	t.is(responseCreate.status, 201)
	// resolve relative location
	const responseRead = await client
	                           .get(url.resolve(userCreate.uri
	                                           , responseCreate.header.location
	                                           )
	                               )
	t.is(responseRead.status, 200)
	t.deepEqual(responseCreate.body, responseRead.body)
}
)
