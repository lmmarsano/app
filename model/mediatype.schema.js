'use strict'
const {Schema} = require('mongoose')
    // , debug = require('debug')('app:mediatype.schema')
    , {StringLowercaseTrim} = require('./common')
// Declare Schema
    , restrictedName = { ...StringLowercaseTrim
                       , required: true
                       , match: /(?!_)\w[\w!#$&^.+-]*/
                       , maxlength: 127
                       }
    , factory = (connection) => {
    const MediaTypeSchema = new Schema
({ _id: { type: String
        , required: true
        , validate: {validator: mediaTypeValidator}
        , alias: 'mediatype'
        }
 , type: restrictedName
 , subtype: restrictedName
 , source: {...StringLowercaseTrim}
 , compressible: {type: Boolean}
 , extensions: { type: [StringLowercaseTrim]
               , default: undefined
               }
 })
	    MediaTypeSchema.index
	    ( { type: 1
	      , subtype: 1
	      }
		  , {unique: true}
	    )
	    MediaTypeSchema.pre('validate', preValidate)
	    return { default: MediaTypeSchema
	           , preValidate
	           , mediaTypeValidator
	           }
    }

async function preValidate() {
	const {_id} = this
	    , index = _id.indexOf('/')
	this.type = _id.substring(0, index)
	this.subtype = _id.substring(index + 1)
}
function mediaTypeValidator(value) {
	return value === [this.type, this.subtype].join('/')
}

// Export Model to be used in Node
module.exports = factory
