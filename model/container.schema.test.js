'use strict'
import {setup, test, mongoose} from '../db-test-helper'
import before from './index.test.before'
import model from '.'
import {documentExists, DocumentExistsError} from './common'

setup
(() => {
	test.serial.beforeEach
	(async (t) => {
		const {context} = t
		    , Model = await model(context.connection)
		Object.assign(context, {Model}, await before(Model))
	})
})

test
( 'Container.getIds returns working resource & data _id values'
, async (t) => {
	const {containerId: _id, Model: {Container, Resource, Data}} = t.context
	    , {resource, data} = await Container.getIds({_id})
	; (await Promise.all
	   (data.map((md5) => documentExists(Data, {md5}))
	    .concat(resource.map((_id) => documentExists(Resource, {_id}))))
	  ).forEach((value) => t.truthy(value))
}
)

test
( 'Container.removeQuery deletes container & all its resources & data'
, async (t) => {
	const {containerId: _id, Model: {Container, Resource, Data}} = t.context
	    , {resource, data} = await Container.getIds({_id})
	await Container.removeQuery({_id})
	debugger
	for (const value of await Promise.all
	     ([documentExists(Container, {_id})]
	      .concat( data.map((md5) => documentExists(Data,{md5}))
	             , resource.map((_id) => documentExists(Resource,{_id}))
	             )
	     )
	    ) {
		t.falsy(value)
	}
}
)

test
( 'Container.prototype.remove deletes container & all its resources & data'
, async (t) => {
	const {containerId: _id, Model: {Container, Resource, Data}} = t.context
	    , {resource, data} = await Container.getIds({_id})
	await Container.hydrate({_id}).remove()
	for (const value of await Promise.all
	     ([documentExists(Container, {_id})]
	      .concat( data.map((md5) => documentExists(Data,{md5}))
	             , resource.map((_id) => documentExists(Resource,{_id}))
	             )
	     )
	    ) {
		t.falsy(value)
	}
}
)

test
( 'Container.prototype.findOneAndDelete deletes container & all its resources & data'
, async (t) => {
	const {containerId: _id, Model: {Container, Resource, Data}} = t.context
	    , {resource, data} = await Container.getIds({_id})
	await Container.findByIdAndDelete(_id, {_id: 1})
	for (const value of await Promise.all
	     ([documentExists(Container, {_id})]
	      .concat( Array.from(new Set(data)).map((md5) => documentExists(Data,{md5}))
	             , resource.map((_id) => documentExists(Resource,{_id}))
	             )
	     )
	    ) {
		t.falsy(value)
	}
}
)
