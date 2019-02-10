'use strict'
const {Schema, mongo} = require('mongoose')
    , debug = require('debug')('app:data.schema')
    , {isMediaType, operationFeedback, DataExistsError} = require('./common')
    , {magic} = require('../utility')
    , u2p = (stream) => new Promise((resolve, reject) => {
	    stream.once('error', reject)
	    stream.once('finish', resolve)
    })
    , factory = (connection) => {
	    // prerequisite: settle connection before calling this function (await connection)
	    // Declare Schema
	    const DataSchema = new Schema
	    ({ length: {type: Number}
	     , chunkSize: {type: Number}
	     , uploadDate: {type: Date}
	     , filename: {type: String}
	     , contentType: { type: String
	                    , ref: 'MediaType'
	                    , validate: {validator: isMediaType}
	                    }
	     , md5: { type: String
	            , index: true
	            , unique: true
	            }
	     , refCount: { type: Number
	                 , required: true
	                 , default: 1
	                 , min: 0
	                 }
	     })
	        , bucket = new mongo.GridFSBucket(connection.db, {bucketName: 'data'})

	    async function createFromSource(source, options = {}) {
		    const {filename = ''} = source
		        , {mime, output} = await magic(source)
		        , upstream = bucket
		                     .openUploadStream( filename
		                                      , Object.assign
		                                        ( options
		                                        , {mimetype: mime.type}
		                                        )
		                                      )
		        , id = upstream.id.toHexString()
		    try {
			    // upload data
			    const data = this.hydrate(await u2p(output.pipe(upstream)))
			    debug('createFromSource id %s hash %s', id, data.md5)
			    return data
		    } catch (e) {
			    if ( e instanceof mongo.MongoError
			      && e.code === 11000 // duplicate key error
			       ) {
				    // file already exists: remove new data
				    await this.model('Chunk').remove({files_id: upstream.id})
				    debug('createFromSource remove duplicate data id %s', id)
				    throw new DataExistsError(e)
			    } else {
				    throw e
			    }
		    }
	    }
	    function getDownloadStream() {
		    return bucket.openDownloadStream(this._id, ...arguments)
	    }
	    function preRemove() {
		    return bucket.delete(this._id)
	    }

	    Object.assign
	    ( DataSchema.statics
	    , {createFromSource, findByKey, indirectSaveByKey, indirectRemoveByKey, indirectRemoveByKeys}
	    )
	    Object.assign
	    ( DataSchema.methods
	    , {getDownloadStream}
	    )
	    DataSchema
	    .virtual
	    ( 'resources'
	    , { ref: 'Resource'
	      , localField: 'md5'
	      , foreignField: 'data'
	      }
	    )
	    DataSchema.post('save', operationFeedback(debug, 'save'))
	    DataSchema.pre('remove', preRemove)
	    DataSchema.post('remove', operationFeedback(debug, 'remove'))

	    return {default: DataSchema}
    }

class FileRequiredError extends Error {
	constructor(key) {
		super('A file is required.')
		this.key = key
	}
}

async function findByKey(md5, ...args) {
	// increment refCount on existing data
	// otherwise create new entry
	// return data with updated id
	return this.findOne({md5}, ...args)
}
async function indirectSaveByKey(md5, fetcher) {
	// increment refCount on existing data
	// otherwise create new entry
	// return data with updated id
	let data
	if ( md5
	  && (data = await this
	                   .findByKey( md5
	                             , { md5: 1
	                               , refCount: 1
	                               }
	                             )
	     )
	   ) {
		++data.refCount
		debug('indirectSaveByKey increment refCount %O', data)
		return data.save()
	} else if (fetcher) {
		debug('indirectSaveByKey createFromSource')
		return this.createFromSource(await fetcher())
	} else {
		throw new FileRequiredError(md5)
	}
}
async function indirectRemoveByKey(md5, count = 1, options = {}) {
	// decrement refCount by count
	// if 0, then remove
	const data = await this.findOneAndUpdate
	( {md5}
	, {$inc: {refCount: -count}}
	, Object.assign
	  ( options
	  , { select: Object.assign({}, options.select, {refCount: 1})
	    , new: true
	    }
	  )
	)
	    , {refCount} = data
	debug('indirectRemoveByKey decrement refCount %O', data)
	if (refCount && 0 < refCount) {
		return data
	} else {
		const value = await data.remove()
		debug('indirectRemoveByKey remove %O', value)
		return value
	}
}
async function indirectRemoveByKeys(keys, projection = {}) {
	// handle multiplicity
	// decrement refCount
	// if 0, then remove
	const counter = {}
	keys.forEach((key) => counter[key] = (counter[key] || 0) + 1)
	debug('indirectRemoveByKeys %O', counter)
	return Promise.all
	(Object.keys(counter).map
	 ((key) => this.indirectRemoveByKey
	  (key, counter[key])
	 )
	)
}

// Export Model to be used in Node
module.exports = Object.assign(factory, {FileRequiredError})
