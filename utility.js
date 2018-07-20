'use strict'
const {posix} = require('path')
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
    , relativeUrl = (from, to) => from.endsWith('/')
                               ? to
                               : posix.join( posix.basename(from)
                                           , to
                                           )
module.exports = {prune, relativeUrl}
