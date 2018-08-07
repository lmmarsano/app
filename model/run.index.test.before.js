'use strict'
const connection = require('../connection-test-helper')('test')
    , model = require('.')
    , init = require('./index.test.before')
    , error = console.error.bind(console)
    , run = async () => {
	    await connection.dropDatabase()
	    init(await model(connection))
    }
run().then(error, error)
