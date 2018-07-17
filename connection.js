'use strict'
const {title, db: {host, port, name, auth}} = require('./config')
    , mongoose = require('mongoose')
    , {connection} = mongoose

connection.on('error', (err) => console.error('connection error:', err))
connection.once('open', () => console.error('db connection successful'))

module.exports = mongoose
                 .connect( `mongodb://${host}:${port}/${name}`
                         , { appname: title
                           , auth
                           , useNewUrlParser: true
                           }
                         )
