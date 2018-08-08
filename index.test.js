'use strict'
import {setup, test} from './db-test-helper'
import url from 'url'
import request from 'supertest'
import init from '.'

setup()

test.beforeEach(async (t) => {
	const {context} = t
	    , app = await init(context.connection)
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
