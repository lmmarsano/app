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
( 'deleting a reused data resource decrements data\'s reference count'
, async (t) => {
	const {reResourceId: _id, Model: {Resource, Data}} = t.context
	    , {data} = await Resource.findById(_id, {data: 1})
	    , {refCount} = await Data.findByKey(data, {refCount: 1})
	await Resource.findByIdAndDelete(_id, {select: {data: 1}})
	t.truthy(await documentExists( Data
	                             , { md5: data
	                               , refCount: refCount - 1
	                               }
	                             )
	        )
}
)

test
( 'Resource.prototype.remove deletes a resource & its data'
, async (t) => {
	const {resourceId: _id, Model: {Resource, Data}} = t.context
	    , resource = await Resource.findById(_id, {data: 1})
	await resource.remove()
	t.falsy(await documentExists(Data, {md5: resource.data}))
}
)

test
( 'Resource.findOneAndDelete deletes a resource & its data'
, async (t) => {
	const {resourceId: _id, Model: {Resource, Data}} = t.context
	    , {data: md5} = await Resource.findById(_id, {data: 1})
	await Resource.findByIdAndDelete(_id, {select: {data: 1}})
	t.falsy(await documentExists(Data, {md5}))
}
)

test
( 'Resource.add creates a resource & its data'
, async (t) => {
	const {containerId: container, Model: {Resource, Data}, fetcherFactory} = t.context
	    , {data: md5} = await Resource.add
	( { container
	  , type: 'text/plain'
	  , name: 'resource.add'
	  }
	, fetcherFactory('Resource.add')
	)
	t.truthy(await documentExists(Data, {md5}))
}
)

test
( 'Resource.add fails for resource conflict'
, async (t) => {
	const {resourceId: _id, Model: {Resource, Data}, fetcherFactory} = t.context
	    , {name, container} = await Resource
	                                .findById(_id, {name: 1, container: 1})
	try {
		await Resource.add
		( { container
		  , name
		  , type: 'text/plain'
		  }
		, fetcherFactory('Resource.add resource conflict')
		)
	} catch (e) {
		return t.truthy(e instanceof DocumentExistsError)
	}
	t.fail()
}
)

test
( 'Resource.add fails for container conflict'
, async (t) => {
	const {containerId: container, Model: {Resource, Data}, fetcherFactory} = t.context
	try {
		await Resource.add
		( { container
		  , name: 'conflict'
		  , type: 'text/plain'
		  }
		, fetcherFactory('Resource.add container conflict')
		)
	} catch (e) {
		return t.is(e.name, 'ValidationError')
	}
	t.fail()
}
)

test
( 'Resource.prototype.deepUpdate decrements reused data & creates new data'
, async (t) => {
	const {reResourceId: _id, Model: {Resource, Data}, fetcherFactory} = t.context
	    , resource = await Resource
	                       .findById(_id)
	                       .populate({ path: 'vdata'
	                                 , select: { md5: 1
	                                           , refCount: 1
	                                           }
	                                 })
	    , { vdata: { md5: data
	               , refCount
	               } = {}
	      } = resource
	    , {data: newData} = await resource.deepUpdate
	( {_id, data: 'change'}
	, fetcherFactory('Resource.prototype.deepUpdate')
	)
	t.truthy(await documentExists( Data
	                             , { md5: newData
	                               , $or: [ {refCount: 1}
	                                      , {refCount: {$exists: false}}
	                                      ]
	                               }
	                             )
	        )
	t.truthy(await documentExists( Data
	                             , { md5: data
	                               , refCount: refCount - 1
	                               }
	                             )
	        )
}
)

test
( 'Resource.prototype.deepUpdate decrements reused data & increments existing data'
, async (t) => {
	const {reResourceId: _id, dataKey: nextDataKey, Model: {Resource, Data}} = t.context
	    , [ resource
	      , {refCount: nextRefCount}
	      ] = await Promise.all
	([ Resource
	   .findById(_id)
	   .populate({ path: 'vdata'
	             , select: { md5: 1
	                       , refCount: 1
	                       }
	             })
	 , Data
	   .findByKey(nextDataKey, {refCount: 1})
	 ])
	    , { vdata: { md5: dataKey
	               , refCount
	               } = {}
	      } = resource
	await resource.deepUpdate({_id, data: nextDataKey})
	t.truthy(await documentExists( Data
	                             , { md5: nextDataKey
	                               , refCount: nextRefCount + 1
	                               }
	                             )
	        )
	t.truthy(await documentExists( Data
	                             , { md5: dataKey
	                               , refCount: refCount - 1
	                               }
	                             )
	        )
}
)

test
( 'Resource.prototype.deepUpdate deletes data & increments existing data'
, async (t) => {
	const {resourceId: _id, reDataKey: nextDataKey, Model: {Resource, Data}} = t.context
	    , [ resource
	      , {refCount: nextRefCount}
	      ] = await Promise.all
	([ Resource
	   .findById(_id)
	   .populate({ path: 'vdata'
	             , select: { md5: 1
	                       , refCount: 1
	                       }
	             })
	 , Data
	   .findByKey(nextDataKey, {refCount: 1})
	 ])
	    , { vdata: { md5: dataKey
	               , refCount
	               } = {}
	      } = resource
	await resource.deepUpdate({_id, data: nextDataKey})
	t.truthy(await documentExists( Data
	                             , { md5: nextDataKey
	                               , refCount: nextRefCount + 1
	                               }
	                             )
	        )
	t.falsy(await documentExists(Data, {md5: dataKey}))
}
)

test
( 'Resource.prototype.deepUpdate skips non-updates'
, async (t) => {
	const {resourceId: _id, Model: {Resource, Data}} = t.context
	    , resource = await Resource
	                       .findById(_id)
	                       .populate({ path: 'vdata'
	                                 , select: { md5: 1
	                                           , refCount: 1
	                                           }
	                                 })
	    , { vdata: { md5
	               , refCount
	               } = {}
	      } = resource
	await resource.deepUpdate({_id, data: md5})
	t.truthy(await documentExists( Data
	                             , { md5
	                               , $or: [ {refCount}
	                                      , {refCount: {$exists: false}}
	                                      ]
	                               }
	                             )
	        )
}
)

test
( 'Resource.prototype.deepUpdate updates names'
, async (t) => {
	const {resourceId: _id, Model: {Resource, Data}} = t.context
	    , resource = await Resource.findById(_id)
	    , {name} = resource
	await resource.deepUpdate({_id, name: 'newName'})
	t.not(name, 'newname')
	t.truthy(await documentExists( Resource
	                             , { _id
	                               , name: 'newname'
	                               }
	                             )
	        )
}
)

test
( 'Resource.prototype.deepUpdate updates containers'
, async (t) => {
	const {resourceId: _id, reContainerId: container, Model: {Resource, Data}} = t.context
	    , resource = await Resource.findById(_id)
	    , {containerId} = resource
	await resource.deepUpdate({_id, container})
	t.falsy(container.equals(containerId))
	t.truthy(await documentExists( Resource
	                             , { _id
	                               , container
	                               }
	                             )
	        )
}
)

test
( 'Resource.prototype.deepUpdate fails for resource conflict'
, async (t) => {
	const {resourceId: _id, reResourceId: occupiedId, Model: {Resource, Data}} = t.context
	    , [resource, occupied] = await Promise.all
	([ _id, occupiedId].map((id) => Resource.findById(id)))
	    , {name, container} = occupied
	try {
		await resource.deepUpdate({_id, name, container})
	} catch (e) {
		return t.truthy(e instanceof DocumentExistsError)
	}
	t.fail()
}
)
