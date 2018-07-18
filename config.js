'use strict'
require('dotenv').config()
const path = require('path')
    , os = require('os')
    , { PORT = '3000'
      , dbHost = 'localhost'
      , dbPort = 27017
      , db = 'journal'
      , dbUser
      , dbPassword
      , kdCycles
      , kdMemory // = os.freemem() / (1 << 10) | 0
      , kdFreeProp
      , kdCores = os.cpus().length
      } = process.env
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10)
	return isNaN(port)
	     ? val // named pipe
	     : 0 <= port
	    && port // port number
}

// drop unused keys (values undefined or {})
function prune(obj) {
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

module.exports = prune
({ title: 'REST journal'
 , port: normalizePort(PORT)
 , db: { host: dbHost
       , port: dbPort
       , name: db
       , auth: { user: dbUser
               , password: dbPassword
               }
       }
 , cookieSecret: ['secret']
 , servePath: path.join(__dirname, 'public')
 , argon2: { timeCost: kdCycles
           , memoryCost: kdMemory
           , parallelism: kdCores
           }
 })
