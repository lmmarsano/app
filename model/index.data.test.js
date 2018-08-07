'use strict'
const connection = require('../connection')
    , {default: MediaTypeSchema} = require('./mediatype.schema')
    , {initialize} = require('./index.data')
    , log = console.error.bind(console)
connection
.then(async (connection) => {
	connection.connection.dropCollection('mediatypes')
	const MediaType = connection.model('MediaType', MediaTypeSchema)
	await MediaType.init()
	return initialize({MediaType})
})
.finally(log, log)
