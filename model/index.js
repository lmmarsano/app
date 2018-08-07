'use strict'
const mongoose = require('mongoose')
    , debug = require('debug')('app:model')
    , {initialize} = require('./index.data')
    , model = async (connection = mongoose) => {
	    // declare models
	    const Model = {}
	    // create dependencies before dependents
	    Model.Data = connection.model
	    ( 'Data'
	    , require('./data.schema')(connection).default
	    , 'data.files'
	    )
	    Model.Chunk = connection.model
	    ( 'Chunk'
	    , require('./chunk.schema')(connection).default
	    , 'data.chunks'
	    )
	    for (const key of 'User MediaType Container Resource'.split(' ')) {
		    Model[key] = connection.model(key, require(`./${key.toLowerCase()}.schema`)(connection).default)
	    }
	    // synchronize indices
	    await Promise.all(Object.values(Model).map((value) => value.init()))
	    // load data
	    await initialize(Model)
	    return Model
    }

// export model factory
module.exports = model
