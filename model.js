'use strict'
/* models/todo.js */
const mongoose = require('mongoose')
    , argon2 = require('argon2')
    , util = require('util')
    , os = require('os')
    , {argon2: argon2options = {}} = require('./config') || {}
    , debug = require('debug')('app:model')
// Declare Schema
    , UserSchema = new mongoose.Schema
({ name: { type: String
         , required: true
         , trim: true
         , unique: true
         }
 , password: { type: String
             , required: true
             }
 })
    , verifier = 	(name, password) => async (user) => {
	    debug('verify %O %s', user, password)
	    if (user) {
		    if (await argon2.verify(user.password, password)) {
			    return user
		    }
	    } else {
		    throw Object.assign( new Error('User not found.')
			                     , { expose: true
			                       , status: 422
			                       , name
			                       }
		                       )
	    }
    }

async function authenticateP(name, password) {
	debug('authenticate %s %s', ...arguments)
	return await verifier
	             .call(null, ...arguments)(await this
	                                             .findOne({name}))
}
UserSchema.statics.authenticate = function authenticate(name, password, callback) {
	return arguments.length === 2
	     ? authenticateP.call(this, ...arguments)
	     : util.callbackify(authenticateP).call(this, ...arguments)
}
UserSchema.pre
( 'save'
, async function preSave() {
	debug('hash password %s', this.password)
	return this.password = await argon2.hash
	( this.password
	, {...argon2options}
	)
}
)
// Declare Model to mongoose with Schema
const model = (connection = mongoose) => ({User: connection.model('User', UserSchema)})

// Export Model to be used in Node
module.exports = model
