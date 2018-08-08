'use strict'
const user = require('./user')
    , container = require('./container')
    , resource = require('./resource')
    , data = require('./data')
    , factory = (Model, path) => Object.assign
( {}
, ...[user, container, resource, data].map((factory) => factory(Model, path))
)
module.exports = factory
