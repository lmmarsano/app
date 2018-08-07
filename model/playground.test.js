'use strict'
import {setup, test, mongoose} from '../db-test-helper'
import {Segment, name} from './common'
import {tap} from '../utility'
const {Schema} = mongoose
    , {preValidate} = name
    , ResourceSchemaObj = { name: { ...Segment
                                  , required: true
                                  }
                          , type: { type: Schema.Types.ObjectId
                                  , required: true
                                  }
                          , data: { type: Buffer
                                  , required: true
                                  }
                          , first: { type: String }
                          , second: { type: String }
                          }
    , ResourceSchema = new Schema(ResourceSchemaObj)

ResourceSchema.virtual('pair')
.get
( function get() {
	return [this.first, this.second].join(' ')
}
)
.set
( function set(value) {
	[this.first, this.second] = value.split(' ')
}
)

ResourceSchema.index
( { name: 1
  , data: 1
  }
, {unique: true}
)

ResourceSchema.pre('validate', preValidate)

setup
(() => {
	test.beforeEach
	((t) => {
		const {context} = t
		    , {connection} = context
		    , Resource = connection.model('Resource', ResourceSchema)
		Object.assign(context, {Resource})
	})
})

test
( 'Resource exists'
, (t) => t.truthy(t.context.Resource)
)

test
( 'schema.obj matches defining object'
, (t) => t.is(ResourceSchema.obj, ResourceSchemaObj)
)

test
( 'model instances are sane'
, (t) => {
	const {Resource} = t.context
	    , idString = '000000000000'
	    , id = new mongoose.Types.ObjectId(idString)
	    , resource = new Resource({ name: 'name'
	                              , type: id
	                              , spurious: true
	                              })
	t.is(resource.constructor, Resource)
	t.is(resource.name, 'name')
	t.is(resource.type, id)
	t.is(resource.data, undefined)
	t.truthy('data' in resource)
	t.is(resource.spurious, undefined)
	t.falsy('spurious' in resource)
})

test
( 'hydrate converts plain to model'
, (t) => {
	const {Resource} = t.context
	    , name = 'name'
	    , type = '000000000000'
	    , resource = Resource.hydrate({ name
	                                  , type
	                                  , spurious: true
	                                  })
	t.is(resource.name, 'name')
	t.truthy(resource.type instanceof mongoose.Types.ObjectId)
	t.truthy(resource.type.equals(new mongoose.Types.ObjectId(type)))
	t.is(resource.data, undefined)
	t.is(resource.spurious, undefined)
})

test
( 'toObject does not convert model to plain'
, (t) => {
	const {Resource} = t.context
	    , name = 'name'
	    , type = '000000000000'
	    , resource = Resource.hydrate({ name
	                                  , type
	                                  , spurious: true
	                                  })
	t.notDeepEqual(resource.toObject(), {name, type})
})

test
( 'model preserves buffers'
, (t) => {
	const {Resource} = t.context
	    , data = Buffer.from('data')
	    , resource = new Resource({data})
	t.not(resource.data, undefined)
	t.is(resource.data.constructor, Buffer)
	t.not(resource.data, data)
	t.truthy(resource.data.equals(data))
})

test
( 'model hydrates values to buffers'
, (t) => {
	const {Resource} = t.context
	    , data = 'data'
	    , resource = Resource.hydrate({data})
	t.not(resource.data, undefined)
	t.is(resource.data.constructor, Buffer)
	t.not(resource.data, data)
	t.truthy(resource.data.equals(Buffer.from(data)))
})

test
( 'constructor applies virtual setters'
, (t) => {
	const {Resource} = t.context
	    , pair = 'first second'
	    , resource = new Resource({pair})
	t.is(resource.pair, pair)
	t.is(resource.first, 'first')
	t.is(resource.second, 'second')
})

test
( 'hydrate does not apply virtual setters'
, (t) => {
	const {Resource} = t.context
	    , pair = 'first second'
	    , resource = Resource.hydrate({pair})
	t.not(resource.pair, pair)
	t.not(resource.first, 'first')
	t.not(resource.second, 'second')
})
