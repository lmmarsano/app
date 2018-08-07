'use strict'
const {title, db: {host, port, name, auth}} = require('./config')
    , mongoose = require('mongoose')
    , {connection} = mongoose
    , uri = `mongodb://${host}:${port}/${name}`

mongoose.connect
( uri
, { appname: title
  , auth
  , useNewUrlParser: true
  }
)
connection.on('error', (err) => console.error('%s connection error:', uri, err))
connection.once('open', () => console.error('successful db connection', uri))

module.exports = connection
