'use strict'
const debug = require('debug')('app:init-data')
    , {documentExists} = require('./common')
    , {tap} = require('../utility')
    , initialize = async (Model) => {
	    const MediaType = Model.MediaType
	    if (await documentExists(MediaType, {})) {
		    debug('MediaType collection exists.')
	    } else if (process.env.NODE_ENV === 'test') {
		    await MediaType.create
		    ([{ _id: 'text/plain'
		      , 'source': 'iana'
		      , 'compressible': true
		      , 'extensions': ['txt','text','conf','def','list','log','in','ini']
		      }])
		    debug('MediaType test collection created.')
	    } else {
		    await MediaType
		          .create(Array.from(mediaGen(require('mime-db'))))
		    debug('MediaType collection created.')
	    }
    }

function * mediaGen(data) {
	for(const _id in data) {
		yield Object.assign(data[_id], {_id})
	}
}

module.exports = {initialize, mediaGen}
