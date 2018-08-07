'use strict'
const pathToRegexp = require('path-to-regexp')
    , {relativeUrl} = require('../utility')
    , isValidationError = ({errors}, properties) =>
	errors && [ 422 // Unprocessable Entity
	          , Object
	            .values(errors)
	            .map((error) => error.message)
	            .join(`
`)
	          , Object.assign
	            ( {}
	            , properties
	            , {invalid: Object.keys(errors)}
	            )
	          ]
    , isDuplicateError = (error) => error.name === 'MongoError'
                                 && error.code === 11000
    , validationThrow = (ctx, error, properties) => {
	    const args = isValidationError(error, properties)
	    if (args) {
		    ctx.throw(...args)
	    } else {
		    throw error
	    }
    }
    , toRelative = (url) => {
	    const resolve = pathToRegexp.compile(url)
	    return (ctx, params) => relativeUrl( ctx.request.url
	                                      , resolve(params)
	                                      )
    }
    , normalizeCommand = async (ctx, next) => {
	    const {method, operands = {}} = ctx.request.body
	    Object.assign( ctx.state
	                 , {method, operands}
	                 )
	    await next()
    }
module.exports = {isValidationError, isDuplicateError, validationThrow, toRelative, normalizeCommand}
