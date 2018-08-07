'use strict'
const user = require('./user')
    , factory = (Model, path) => Object.assign
({}, ...[user].map((factory) => factory(Model, path)))
module.exports = factory
