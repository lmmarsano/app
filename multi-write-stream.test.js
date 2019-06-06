'use strict'
import test from 'ava'
import {PassThrough} from 'stream'
import getStream from 'get-stream'
import MultiWrite from './multi-write-stream'
const e2p = (stream, event) => new Promise((resolve, reject) => stream.on(event, resolve))
    , eventAll = async (t, event, action) => {
	    const {a, b, multi} = t.context
	        , promises = Promise.all([a, b, multi].map((stream) => e2p(stream, event)))
	    action(t.context)
	    await promises
	    t.pass()
    }
    , eventDestinations = async (t, event, action) => {
	    const {a, b, multi} = t.context
	        , promises = Promise.all([a, b].map((stream) => e2p(stream, event)))
	    action(t.context)
	    await promises
	    t.pass()
    }
    , eventCollective = async (t, event, action) => {
	    const {a, b, multi} = t.context
	        , promises = e2p(multi, event)
	    action(t.context)
	    await promises
	    t.pass()
    }
    , destinationError = ({a}) => a.emit('error', new Error('test'))
    , collectiveEnd = ({multi}) => multi.end()

test.beforeEach
( (t) => {
	const a = new PassThrough
	    , b = new PassThrough
	    , multi = new MultiWrite([a, b])
	    , source = new PassThrough
	source.pipe(multi)
	multi.on('error', () => {})
	Object.assign(t.context, {a, b, multi, source})
}
)

test
( 'instance replicates writes to constituent writables'
, async (t) => {
	const {a, b, multi} = t.context
	    , input = Buffer.from('test')
	multi.write(input)
	multi.end()
	for (const value of await Promise.all([a, b].map((s) => getStream.buffer(s)))) {
		t.truthy(input.equals(value))
	}
}
)

test('collective end triggers destinations to finish', eventDestinations, 'finish', collectiveEnd)
test('collective end triggers destinations to unpipe', eventDestinations, 'unpipe', collectiveEnd)
test('destination error triggers collective error', eventCollective, 'error', destinationError)
test('destination error unpipes collective', eventCollective, 'unpipe', destinationError)
