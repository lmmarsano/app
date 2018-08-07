'use strict'
const {Schema} = require('mongoose')
    , debug = require('debug')('app:model.common')
    , StringLowercaseTrim = { type: String
                            , lowercase: true
                            , trim: true
                            }
    , segmentRxp = /(?:[-\w\s.~!$&'()*+,=@]|%[\da-f]{2}|[^\0-\u{009f}\p{gc=Cs}\p{gc=Co}\p{NChar}])*/iu
    , urlRxp = new RegExp(`(?:/${segmentRxp.source})+/?`, 'iu')
// /(?:\/(?:[-\w\s.~!$&'()*+,=@]|%[\da-f]{2}|[^\0-\u{009f}\p{gc=Cs}\p{gc=Co}\p{NChar}])*)+\/?/iu
    , Segment = { ...StringLowercaseTrim
                , match: segmentRxp
                }
    , documentExists = (Model, query) => Model.findOne(query, {_id: 1})
    , absentOrThrow = async (Model, query) => {
	    const exists = await documentExists(Model, query)
	    if (exists) {
		    throw new DocumentExistsError(exists)
	    }
    }
    , leftEqual = (a, b) => a instanceof Object
                         ? a.equals(b)
                         : a === b
    , operationFeedback = (debug, operation) => function postSave() {
	    debug(`${operation} %O`, this._id)
    }

class DocumentExistsError extends Error {
	constructor(document) {
		super('Document already exists.')
		Object.assign(this, {document})
	}
}
class DataExistsError extends Error {
	constructor(handledError) {
		super('Data already exists.')
		Object.assign(this, {handledError})
	}
}
function isMediaType(_id) {
	// returns promise/query
	return documentExists( this.model('MediaType')
	                     , {_id}
	                     )
}
function removeByIds(_ids, options = {}) {
	/* removes only the documents
	   associated data must be handled apart */
	return this
	       .remove({_id: {$in: _ids}})
	       .setOptions(Object.assign(options, {single: false}))
}
function preValidate() {
	this.name = decodeURI(this.name).normalize()
	debug('decoded name %s', this.name)
}
module.exports = { StringLowercaseTrim
                 , Segment
                 , urlRxp
                 , name: {preValidate}
                 , isMediaType
                 , removeByIds
                 , documentExists
                 , absentOrThrow
                 , leftEqual
                 , operationFeedback
                 , DocumentExistsError
                 , DataExistsError
                 }
