'use strict'
import test from 'ava'
import MongodbMemoryServer from 'mongodb-memory-server'

test
( 'koa-session-mongoose is found'
, (t) => t.notThrows(() => require('koa-session-mongoose'))
)

test
( 'mongodb-memory-server runs'
, async (t) => {
	const mongod = new MongodbMemoryServer
	t.truthy(await mongod.getPort())
	mongod.stop()
}
)
