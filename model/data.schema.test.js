'use strict'
import getStream from 'get-stream'
import {setup, test, mongoose} from '../db-test-helper'
import before from './index.test.before'
import model from '.'
import {documentExists, DocumentExistsError, DataExistsError} from './common'

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
( 'createFromSource fails to create existing data'
, async (t) => {
	const {dataKey: md5, Model: {Data} = {}} = t.context
	    , stream = await (await Data.findOne({md5}, {_id: 1})).getDownloadStream()
	try {
		await Data.createFromSource(stream)
	} catch (e) {
		if (e instanceof DataExistsError) {
			return t.pass()
		}
	}
	t.fail()
}
)

test
( 'indirectSaveByKey increments refCounts on existing data'
, async (t) => {
	const {dataKey: key, Model: {Data} = {}} = t.context
	    , {refCount} = await Data.findByKey(key, {refCount: 1})
	    , {refCount: newRefCount} = await Data.indirectSaveByKey(key)
	t.is(newRefCount, refCount + 1)
}
)

test
( 'indirectSaveByKey creates new data'
, async (t) => {
	const {fetcherFactory, Model: {Data} = {}} = t.context
	    , {refCount} = await Data.indirectSaveByKey('new', fetcherFactory('new'))
	t.is(refCount, 1)
}
)

test
( 'prototype.getDownloadStream provides file'
, async (t) => {
	const {dataKey, Model: {Data}} = t.context
	t.is( (await getStream((await Data
	                              .findByKey(dataKey, {_id: 1})
	                       ).getDownloadStream()
	                      )
	      )
	    , 'data0'
	    )
}
)

test
( 'indirectRemoveByKey decrements refCount of reused data'
, async (t) => {
	const {reDataKey, Model: {Data}} = t.context
	    , {refCount} = await Data.findByKey(reDataKey, {refCount: 1})
	    , {refCount: newRefCount} = await Data.indirectRemoveByKey(reDataKey)
	t.is(refCount, newRefCount + 1)
}
)

test
( 'indirectRemoveByKey deletes no longer used data'
, async (t) => {
	const {dataKey, Model: {Data}} = t.context
	await Data.indirectRemoveByKey(dataKey)
	t.falsy(await documentExists(Data, {md5: dataKey}))
}
)

test
( 'indirectRemoveByKeys iterates indirectRemoveByKey'
, async (t) => {
	const {dataKey, reDataKey, Model: {Data}} = t.context
	    , {refCount} = await Data.findByKey(reDataKey, {refCount: 1})
	await Data.indirectRemoveByKeys([dataKey, reDataKey])
	const {refCount: newRefCount} = await Data.findByKey(reDataKey, {refCount: 1})
	t.falsy(await Data.findByKey(dataKey))
	t.is(refCount, newRefCount + 1)
}
)

test
( 'indirectRemoveByKeys iterates indirectRemoveByKey with multiplicity'
, async (t) => {
	const {dataKey, reDataKey, Model: {Data}} = t.context
	await Data.indirectRemoveByKeys([dataKey, reDataKey, reDataKey])
	await Promise.all
	([dataKey, reDataKey].map
	 (async (key) => t.falsy(await Data.findByKey(key)))
	)
}
)
