'use strict'
const {posix} = require('path')
    , smagic = require('stream-mmmagic')
    , prune = (obj) => {
	    // drop unused keys (values undefined or {})
	    if ( typeof obj === 'object'
	      && obj !== null
	      && Object.getPrototypeOf(obj) === Object.prototype
	       ) {
		    const reducer = (accumulator, key) => {
			    const value = prune(obj[key])
			    if (value !== undefined) {
				    accumulator[key] = value
			    }
			    return accumulator
		    }
		        , newObj = Object
		                   .keys(obj)
		                   .reduce(reducer , {})
		    if (Object.keys(newObj).length) {
			    return newObj
		    }
	    } else {
		    return obj
	    }
    }
    , tap = (reader, value) => {
	    reader(value)
	    return value
    }
    , relativeUrl = (from, to) => from.endsWith('/')
                               ? to
                               : posix.join( posix.basename(from)
                                           , to
                                           )
    , normalizeUrl = (url) => decodeURI((new URL(url, 'http://host/')).pathname)
                             .replace(/\/{2,}/g, '/')
                             .replace(/(.)\/$/, '$1')
                             .normalize()
    , sleep = async (time) => new Promise((resolve) => setTimeout(resolve, time))
    , magic = (...args) =>
	new Promise((resolve, reject) =>
	            smagic( ...args
	                  , (err, mime, output) => err
	                                        ? reject(err)
	                                        : resolve({mime, output})
	                  )
	           )

module.exports = {prune, tap, relativeUrl, normalizeUrl, sleep, magic}
