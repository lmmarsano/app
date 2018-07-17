'use strict'
import test from 'ava'
import request from 'supertest'
import MongodbMemoryServer from 'mongodb-memory-server'
import mongoose from 'mongoose'

import init from '.'
import {User} from './model'
// get sessions model & clear after

const mongod = new MongodbMemoryServer()
test.before(async () => {
	await mongoose.connect( await mongod.getConnectionString()
	                      , {useNewUrlParser: true}
	                      )
})

test.beforeEach(async (t) => {
	const app = await init(mongoose)
	    , agent = request.agent(app.callback())
	    , user = await agent
	                   .post({ name: 'user'
	                         , password: 'password'
	                         })
	                   .send()
	Object.assign(t.context, {agent, user})
})

test.afterEach.always(() => mongoose.connection.dropDatabase())

test.after.always(async () => {
	mongoose.disconnect()
	mongod.stop()
})

test.serial('get user', async (t) => {
	const res = await t
	                  .context
	                  .agent
	                  .get('/api/user/user')
	                  .send()
	t.is(res.status, 200)
	t.is(res.body.name, 'user')
})
