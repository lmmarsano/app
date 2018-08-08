'use strict'
const {Schema} = require('mongoose')
    , argon2 = require('argon2')
    , util = require('util')
    , debug = require('debug')('app:user.schema')
    , {argon2: argon2options = {}} = require('../config')
    , { Segment
      , name: {preValidate}
      , operationFeedback
      } = require('./common')
    , factory = (connection) => {
	    // Declare Schema
	    const UserSchema = new Schema
	    ({ name: { ...Segment
	             , required: true
	             , index: true
	             , unique: true
	             }
	     , password: { type: String
	                 , required: true
	                 , select: false
	                 }
	     })
	    // update username: bypass save middleware

	    Object.assign(UserSchema.statics, {authenticate, getIds, removeQuery})
	    Object.assign(UserSchema.methods, {fill})
	    UserSchema.virtual
	    ( 'containers'
	    , { ref: 'Container'
	      , localField: '_id'
	      , foreignField: 'assignedTo'
	      }
	    )
	    UserSchema.pre('validate', preValidate)
	    UserSchema.pre('save', preSave)
	    UserSchema.post('save', operationFeedback(debug, 'save'))
	    return { default: UserSchema
	           , UserNotFoundError
	           , authenticate
	           , preSave
	           }
    }
    , verifier = 	(password) => async (user) => {
	    debug('verify %O %s', user, password)
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
	                   , {password: 1}
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
	 , {$unwind: '$_id'}
	 , {$project: {_id: '$_id._id'}}
	 , {$lookup: { from: 'resources'
	             , localField: '_id'
	             , foreignField: 'container'
	             , as: 'as'
	             }
	   }
	 , {$unwind: '$as'}
	 , {$group: { _id: null
	            , data: {$push: '$as.data'}
	            , resource: {$addToSet: '$as._id'}
	            , container: {$addToSet: '$_id'}
	            }
	   }
	 , {$project: {_id: 0}}
	 ])
	return output[0]
}
async function removeQuery(query) {
	// remove containers & their associated content
	const ids = await this.getIds(query)
	    , {container, resource, data} = ids
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
