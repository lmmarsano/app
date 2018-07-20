'use strict'
const util = require('util')
    , prototype = Object.create(Function.prototype)
    , functional = (assertion) => Object.setPrototypeOf( (t, expected, f, ...args) => t[assertion](f(...args), expected)
                                                      , prototype
                                                      )
    , title = prototype.title = (title, expected, f, ...args) => {
	const argsString = util.format('%O', args)
	return util.format( `%s
%s(%s) = %O`
	                  , title
	                  , f.name
	                  , argsString.substr(1, argsString.length - 2)
	                  , expected
	                  ).trim()
}
module.exports = {functional, title}
