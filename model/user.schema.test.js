'use strict'
import {setup, test, mongoose} from '../db-test-helper'
import before from './index.test.before'
import model from '.'
import {documentExists, DocumentExistsError} from './common'

setup
(() => {
	test.beforeEach
	(async (t) => {
		const {context} = t
		    , Model = await model(context.connection)
		Object.assign(context, {Model}, await before(Model))
	})
})

test
( 'User.save throws on duplicate names'
, async (t) => {
	const {userId: _id, Model: {User}} = t.context
	    , user = await User.findById(_id)
	try {
		await (new User
		       ({ name: user.name
		        , password: 'password'
		        })
		      ).save()
	} catch (e) {
		return t.pass()
	}
	t.fail()
}
)

test
( 'User.getIds returns working container, resource, data keys'
, async (t) => {
	const {userId: _id, Model: {User, Container, Resource, Data}} = t.context
	    , {container, resource, data} = await User.getIds({_id})
	; (await Promise.all
	   (data.map((md5) => documentExists(Data, {md5}))
	    .concat( resource.map((_id) => documentExists(Resource, {_id}))
	           , container.map((_id) => documentExists(Container, {_id}))
	           )
	   )
	  ).forEach((value) => t.truthy(value))
}
)

test
( 'User.removeQuery deletes user & all its containers, resources, data'
, async (t) => {
	const {userId: _id, Model: {User, Container, Resource, Data}} = t.context
	    , {container, resource, data} = await User.getIds({_id})
	await User.removeQuery({_id})
	for (const value of await Promise.all
	     ([documentExists(User, {_id})]
	      .concat( Array.from(new Set(data)).map((md5) => documentExists(Data,{md5}))
	             , resource.map((_id) => documentExists(Resource,{_id}))
	             , container.map((_id) => documentExists(Container, {_id}))
	             )
	     )
	    ) {
		t.falsy(value)
	}
}
)
