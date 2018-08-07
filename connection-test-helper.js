'use strict'
const {db: {host, port}} = require('./config')
    , mongoose = require('mongoose')
    , connector = (name) => {
	    const uri = `mongodb://${host}:${port}/${name}`
	        , connection = mongoose.createConnection
	    ( uri
	    , {useNewUrlParser: true}
	    )
	    connection.on('error', (err) => console.error('%s connection error:', uri, err))
	    connection.once('open', () => console.error('successful db connection', uri))
	    return connection
    }
module.exports = connector
