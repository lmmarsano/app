'use strict'
const posix = require('path')
    , {Schema} = require('mongoose')
    , debug = require('debug')('app:container.schema')
    , {StringLowercaseTrim, urlRxp, removeByIds, documentExists, operationFeedback} = require('./common')
    , {normalizeUrl} = require('../utility')
    , factory = (connection) => {
	    // return connected model
	    const urlFree = async (url) => {
		    // check no resource from parent container has this url
		    const {dir, base} = posix.parse(url)
		    // parentless: nothing to check
		    if (url === dir) {
			    return true
		    }
		    const container = await documentExists( connection.model('Container')
		                                          , {url: dir}
		                                          )
		                            .populate({ path: 'resources'
		                                      , select: {container: 1}
		                                      , match: {name: base}
		                                      })
		    debug('urlFree occupant %s %O', url, container)
		    return !(container && 0 in container.resources)
	    }
	    // Declare Schema
	        , ContainerSchema = new Schema
	    ({ url: { ...StringLowercaseTrim
	            , match: urlRxp
	            , required: true
	            , index: true
	            , unique: true
	            , validate: {validator: urlFree}
	            }
	     , assignedTo: { type: Schema.Types.ObjectId
	                   , ref: 'User'
	                   , required: true
	                   , index: true
	                   }
	     })
	    Object.assign(ContainerSchema.statics, {getIds, removeByIds, removeQuery, findContainerAndName, findResource})
	    Object.assign(ContainerSchema.methods, {isAuthorized, fill, hasId})
	    ContainerSchema.virtual
	    ( 'resources'
	    , { ref: 'Resource'
	      , localField: '_id'
	      , foreignField: 'container'
	      }
	    )
	    ContainerSchema.pre('validate', preValidate)
	    ContainerSchema.post('save', operationFeedback(debug, 'save'))
	    ContainerSchema.pre('remove', preRemove)
	    ContainerSchema.post('remove', operationFeedback(debug, 'remove'))
	    ContainerSchema.post('findOneAndDelete', postFindOneAndDelete)
	    ContainerSchema.post('findOneAndDelete', operationFeedback(debug, 'findOneAndDelete'))
	    return { default: ContainerSchema
	           , preValidate
	           }
    }
async function preValidate() {
	// fix urls before validating & saving
	this.url = normalizeUrl(this.url)
	debug('normal url %s', this.url)
}
async function getIds(query) {
	// get ids to resources & their data
	const output = await this.aggregate
	([ {$match: query}
	 , {$project: {_id: 1}}
	 , {$lookup: { from: 'resources'
	             , localField: '_id'
	             , foreignField: 'container'
	             , as: '_id'
	             }
	   }
	 , {$unwind: '$_id'}
	 , {$group: { _id: null
	            , data: {$push: '$_id.data'}
	            , resource: {$addToSet: '$_id._id'}
	            }
	   }
	 , {$project: {_id: 0}}
	 ])
	return output[0]
}
async function removeQuery(query) {
	// remove containers & their associated content
	const ids = await this.getIds(query)
	    , {resource, data} = ids
	await Promise.all
	([ this.remove(query)
	 , this.model('Resource').removeByIds(resource)
	 , this.model('Data').indirectRemoveByKeys(data)
	 ])
}
async function findContainerAndName(url) {
	const Container = this.model('Container')
	    , container = await Container.findOne({url})
	if (container) {
		return { container
		       , name: ''
		       }
	} else {
		const {dir, base: name} = posix.parse(url)
		    , container = await Container.findOne({url})
		return container
		    && {container, name}
	}
}
async function findResource(url, options = {}) {
	const normal = normalizeUrl(url)
	    , {dir, base} = posix.parse(normal)
	    , query = await this
	                    .findOne({url: dir})
	                    .populate( Object.assign( options
	                                            , { path: 'resources'
	                                              , match: {name: base}
	                                              }
	                                            )
	                             )
	if (query && 0 in query.resources) {
		return query
	} else {
		const query = await this
		                    .findOne({url: normal})
		                    .populate( Object.assign( options
		                                            , { path: 'resources'
		                                              , match: {name: ''}
		                                              }
		                                            )
		                             )
		return query
		    && 0 in query.resources
		    && query
	}
}

async function preRemove() {
	// remove associated content
	const ids = await this.constructor.getIds({_id: this._id})
	    , {resource, data} = ids
	return Promise.all
	([ this.model('Data').indirectRemoveByKeys(data)
	 , this.model('Resource').removeByIds(resource)
	 ])
}
async function postFindOneAndDelete(container) {
	// remove associated content
	const {_id} = container
	    , resourceQuery = container
	                      .model('Resource')
	                      .find( {container: _id}
	                           , {data: 1}
	                           )
	return Promise.all
	([ container
	   .model('Data')
	   .indirectRemoveByKeys((await resourceQuery)
	                        .map(({data}) => data)
	                       )
	 , resourceQuery
	   .remove()
	   .setOptions({single: false})
	 ])
}

function isAuthorized(user) {
	return user.equals(this.assignedTo)
}
function fill() {
	return this.populate
	({ path: 'resources'
	 , sort: {name: 1}
	 }).exexPopulate()
}
function hasId(_id) {
	return this.id === _id
}

module.exports = factory
