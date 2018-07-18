'use strict'
import test from 'ava'
import request from 'supertest'
import MongodbMemoryServer from 'mongodb-memory-server'
import mongoose from 'mongoose'

import init from '.'
// TODO get sessions model & clear after

const mongod = new MongodbMemoryServer
test.before(async () => {
	await mongoose.connect( await mongod.getConnectionString()
	                      , {useNewUrlParser: true}
	                      )
})

test.beforeEach(async (t) => {
	debugger
	const app = await init(mongoose)
	    , client = request.agent(app.listen())
	    , userCreation = client
	                    .post('/api/user')
	                    .send({ name: 'user'
	                          , password: 'password'
	                          })
	Object.assign(t.context, {client, userCreation})
})

test.afterEach.always(() => mongoose.connection.dropDatabase())

test.after.always(async () => {
	mongoose.disconnect()
	mongod.stop()
})

test.serial
( 'app persists authenticated session'
, async (t) => {
	const {client, userCreation} = t.context
	    , responseCreate = await userCreation
	t.regex( responseCreate
	         .header['set-cookie']
	         .join(`
`)
	       , /session/
	       )
	t.is(responseCreate.status, 200)
	const responseRead = await client
	                           .get('/api/user/user')
	t.is(responseRead.status, 200)
	t.deepEqual(responseCreate.body, responseRead.body)
})
