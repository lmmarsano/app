'use strict'
const {Schema, mongo} = require('mongoose')
    , debug = require('debug')('app:chunk.schema')
    , {operationFeedback} = require('./common')
    , factory = (connection) => {
	    // Declare Schema
	    const ChunkSchema = new Schema
	    ({ files_id: {type: Schema.Types.ObjectId}
	     , n: {type: Number}
	     , data: {type: Buffer}
	     })
	    ChunkSchema.post('save', operationFeedback(debug, 'save'))
	    ChunkSchema.post('remove', operationFeedback(debug, 'remove'))

	    return {default: ChunkSchema}
    }

module.exports = factory
