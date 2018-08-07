'use strict'
const {posix} = require('path')
    , mongoose = require('mongoose')
    , {Schema} = mongoose
    , debug = require('debug')('app:resource.schema')
    , { Segment
      , removeByIds
      , name: {preValidate}
      , isMediaType
      , documentExists
      , absentOrThrow
      , leftEqual
      , operationFeedback
      } = require('./common')
    , {tap, normalizeUrl} = require('../utility')
    , factory = (connection) => {
	    // Declare Schema
	    const ResourceProto = { name: { ...Segment
	                                  , required: true
	                                  , validate: {validator: isAvailable}
	                                  }
	                          , type: { type: String
	                                  , ref: 'MediaType'
	                                  , validate: {validator: isMediaType}
	                                  }
	                          , data: { type: String
	                                  , required: true
	                                  }
	                          , container: { type: Schema.Types.ObjectId
	                                       , ref: 'Container'
	                                       , required: true
	                                       }
	                          }
	        , ResourceSchema = new Schema(ResourceProto)
	        , ResourceKeys = Object.keys(ResourceProto)

	    async function deepUpdate(diff, fetcher) {
		    // check for changes: new path free, data change
		    const Resource = this.constructor
		        , Data = this.model('Data')
		        , data = this.vdata
		              || await Data.findByKey(this.data)
		        , hasUpdated = (key) => {
			        const value = diff[key]
			        return !( value === undefined
			               || leftEqual(value, this[key])
			                )
		        }
		        , modifiedKeys = new Set(ResourceKeys.filter(hasUpdated))
		    if (!this.type && diff.type === data.contentType) {
			    modifiedKeys.delete('type')
		    }
		    if (modifiedKeys.size) {
			    debug('safeUpdate modified keys %O', modifiedKeys)
			    const {data} = this
			    for (const key of modifiedKeys) {
				    this[key] = diff[key]
			    }
			    // validate
			    await this.validate()
			    // update url check
			    if ( ['name', 'container']
			         .some((key) => modifiedKeys.has(key))
			       ) {
				    const {name, container} = this
				    await absentOrThrow(Resource, {name, container})
				    debug('safeUpdate url')
			    }
			    // mediatype removal check
			    if (modifiedKeys.has('type') && diff.type === data.contentType) {
				    this.type = undefined
			    }
			    // update data
			    if (modifiedKeys.has('data')) {
				    const [{md5}] = await Promise.all
				    ([ Data.indirectSaveByKey(this.data, fetcher)
				     , Data.indirectRemoveByKey(data)
				     ])
				    debug('safeUpdate data %s', this.data = md5)
			    }
			    // save
			    await this.save()
			    debug('safeUpdate save resource %O', this)
		    } else {
			    debug('safeUpdate unchanged resource %O', this)
		    }
		    return this
	    }

	    Object.assign
	    ( ResourceSchema.statics
	    , {add, removeByIds}
	    )
	    Object.assign(ResourceSchema.methods, {isAuthorized, deepUpdate})

	    ResourceSchema
	    .virtual('url')
	    .get(urlGet)              // returns a Promise
	    ResourceSchema.virtual
	    ( 'vdata'
	    , { ref: 'Data'
	      , localField: 'data'
	      , foreignField: 'md5'
	      , justOne: true
	      }
	    )
	    ResourceSchema.index
	    ( { name: 1
	      , container: 1
	      }
	    , {unique: true}
	    )

	    ResourceSchema.pre('validate', preValidate)
	    ResourceSchema.post('save', operationFeedback(debug, 'save'))
	    ResourceSchema.post('remove', postFindOneAndDelete)
	    ResourceSchema.post('findOneAndDelete', postFindOneAndDelete)
	    return { default: ResourceSchema
	           , preValidate
	           }
    }

async function isAvailable(name) {
	/* empty name is always available
	   checks for conflict with full path container */
	return !( name
	       && tap( (value) => debug('name occupant %O', value)
	             , await documentExists
	               ( this.model('Container')
	               , {url: await this.url}
	               )
	             )
	        )
}

async function urlGet() {
	// returns full path to resource
	const {container: {url} = {}} = await this.populate
	({ path: 'container'
	 , select: {url: 1}
	 }).execPopulate()
	return tap( (value) => debug('urlGet %s', value)
	          , posix.join(url, this.name)
	          )
}

async function add(raw, dataFetcher) {
	/* checks full path container conflicts
	   fetches data if necessary */
	const resource = new this(raw)
	if ('data' in raw) {
		await resource.validate()
	} else {
		resource.data = 'temporary'
		await resource.validate()
		resource.data = undefined
	}
	const {name, container} = resource
	await absentOrThrow(this, {name, container})
	const Data = this.model('Data')
	    , newData = await Data.indirectSaveByKey(resource.data, dataFetcher)
	debug('add data %O', resource.data = newData.md5)
	return resource.save()
}
async function postFindOneAndDelete(resource) {
	// removes associated data
	const {data} = resource
	await resource.model('Data').indirectRemoveByKey(data)
	debug('post remove resource %O data %O', resource, data)
	return resource
}

async function isAuthorized(user) {
	return user.equals
	((await this.populate({path: 'container'}))
	 .container.assignedTo
	)
}

// Export Model to be used in Node
module.exports = factory
