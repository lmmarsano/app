'use strict'
const {Schema} = require('mongoose')
    , argon2 = require('argon2')
    , util = require('util')
    , debug = require('debug')('app:user.schema')
    , {argon2: argon2options = {}} = require('../config')
    , { Segment
      , name: {normalize}
      , getModifiedKeys
      , operationFeedback
      } = require('./common')
    , factory = (connection) => {
	    // Declare Schema
	    const UserSchemaProto = { name: { ...Segment
	                                    , required: true
	                                    , index: true
	                                    , unique: true
	                                    , set: normalize
	                                    }
	                            , password: { type: String
	                                        , required: true
	                                        , select: false
	                                        }
	                            }
	        , UserSchema = new Schema( UserSchemaProto
	                                 , {toJSON: {virtuals: true}}
	                                 )
	        , UserKeys = Object.keys(UserSchemaProto)

	    async function safeUpdate(diff) {
		    // check for changes
		    const User = this.constructor
		        , modifiedKeys = getModifiedKeys(UserKeys, this, diff)
		    if (modifiedKeys.size) {
			    debug('safeUpdate modified keys %O', modifiedKeys)
			    for (const key of modifiedKeys) {
				    this[key] = diff[key]
			    }
			    if (modifiedKeys.has('password')) {
				    await this.save()
			    } else {
				    // unchanged password: bypass save middleware
				    // validate
				    await this.validate()
				    for (const key of modifiedKeys) {
					    diff[key] = this[key]
				    }
				    await User.update
				    ( {_id: this._id}
				    , {$set: diff}
				    )
			    }
			    debug('safeUpdate save resource %O', this)
		    } else {
			    debug('safeUpdate unchanged resource %O', this)
		    }
		    return this
	    }

	    Object.assign(UserSchema.statics, {authenticate, getIds, removeQuery})
	    Object.assign(UserSchema.methods, {fill, safeUpdate})
	    UserSchema.virtual
	    ( 'containers'
	    , { ref: 'Container'
	      , localField: '_id'
	      , foreignField: 'assignedTo'
	      }
	    )
	    UserSchema.pre('save', preSave)
	    UserSchema.post('save', operationFeedback(debug, 'save'))
	    return { default: UserSchema
	           , UserNotFoundError
	           , authenticate
	           , preSave
	           }
    }
    , verifier = 	(password) => async (user) => {
	    debug('verifier %s %O', password, user)
	    if (user) {
		    if (await argon2.verify(user.password, password)) {
			    return user
		    }
	    } else {
		    throw new UserNotFoundError
	    }
    }
    , authenticateP = async (model, credential) => {
	    const user = new model(credential)
	    await user.validate()
	    debug('authenticate %O', user)
	    return verifier
	    (user.password)
	    (await model
	           .findOne( {name: user.name}
	                   , { name: 1
	                     , password: 1
	                     }
	                   )
	    )
    }
    , authenticateC = util.callbackify(authenticateP)

class UserNotFoundError extends Error {
	constructor() {
		super('User not found.')
	}
}

function authenticate(credential, callback) {
	return arguments.length < 2
	     ? authenticateP(this, ...arguments)
	     : authenticateC(this, ...arguments)
}
async function preSave() {
	debug('hash password %s', this.password)
	return this.password = await argon2.hash
	( this.password
	, {...argon2options}
	)
}
async function getIds(query) {
	// get ids to resources & their data
	const output = await this.aggregate
	([ {$match: query}
	 , {$project: {_id: 1}}
	 , {$lookup: { from: 'containers'
	             , localField: '_id'
	             , foreignField: 'assignedTo'
	             , as: '_id'
	             }
	   }
	 , {$unwind: { path: '$_id'
	             , preserveNullAndEmptyArrays: true
	             }
	   }
	 , {$project: {_id: '$_id._id'}}
	 , {$lookup: { from: 'resources'
	             , localField: '_id'
	             , foreignField: 'container'
	             , as: 'as'
	             }
	   }
	 , {$unwind: { path: '$as'
	             , preserveNullAndEmptyArrays: true
	             }
	   }
	 , {$group: { _id: null
	            , data: {$push: '$as.data'}
	            , resource: {$addToSet: '$as._id'}
	            , container: {$addToSet: '$_id'}
	            }
	   }
	 , {$project: {_id: 0}}
	 ])
	debug('getIds %O', output)
	return output[0]
}
async function read(query) {
	// get ids to resources & their data
	const output = await this.aggregate
	([ {$match: query}
	 , {$project: {name: 1}}
	 , {$lookup: { from: 'containers'
	             , localField: '_id'
	             , foreignField: 'assignedTo'
	             , as: 'containers'
	             }
	   }
	 , {$project: {'containers.assignedTo': 0}}
	 , {$lookup: { from: 'resources'
	             , localField: 'containers._id'
	             , foreignField: 'container'
	             , as: 'resources'
	             }
	   }
	 , { $project:
			 { resources: 0
			 , containers:
				 { $map:
					 { input: '$containers'
					 , as: 'container'
					 , in:
						 { $mergeObjects:
							 [ '$$container'
							 , { resources:
									 { $filter:
										 { input: '$resources'
										 , cond:
											 { $eq:
												 [ '$$container._id'
												 , '$$this.container'
												 ]
											 }
										 }
									 }
								 }
							 ]
						 }
					 }
				 }
			 }
		 }
	 , {$project: {'containers.resources.container': 0}}
	 , {$lookup: { from: 'data.files'
	             , localField: 'containers.resources.data'
	             , foreignField: 'md5'
	             , as: 'data'
	             }
	   }
	 , { $project:
			 { data: 0
			 , containers:
				 { $map:
					 { input: '$containers'
					 , as: 'container'
					 , in:
						 { $mergeObjects:
							 [ '$$container'
							 , { resources:
									 { $map:
										 { input: '$$container.resources'
										 , as: 'resource'
										 , in:
											 { $mergeObjects:
												 [ '$$resource'
												 , { $ifNull:
														 [ '$$resource.type'
														 , { type:
																 { $let:
																	 { vars:
																		 { data:
																			 { $elementAt:
																				 [ { $filter:
																						 { input: '$data'
																						 , cond:
																							 { $eq:
																								 [ '$$resource.data'
																								 , '$$this.md5'
																								 ]
																							 }
																						 }
																					 }
																				 , 0
																				 ]
																			 }
																		 }
																	 , in: '$$data.contentType'
																	 }
																 }
															 }
														 ]
													 }
												 ]
											 }
										 }
									 }
								 }
							 ]
						 }
					 }
				 }
			 }
		 }
	 ])
	debug('read %O', output)
	return output
}
async function removeQuery(query) {
	// remove containers & their associated content
	const ids = await this.getIds(query)
	    , {container, resource, data} = ids || {}
	await Promise.all
	([ this.remove(query)
	 , this.model('Container').removeByIds(container)
	 , this.model('Resource').removeByIds(resource)
	 , this.model('Data').indirectRemoveByKeys(data)
	 ])
}

function fill() {
	return this.populate
	({ path: 'containers'
	 , sort: {url: 1}
	 , populate: { path: 'resources'
	             , sort: {name: 1}
	             }
	 }).execPopulate()
}
// Export Model to be used in Node
module.exports = Object.assign(factory, {UserNotFoundError})
