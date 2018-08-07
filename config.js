'use strict'
require('dotenv').config()
const path = require('path')
    , os = require('os')
    , {prune} = require('./utility')
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
      , hash = 'md5'
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
 , hash
 }) || {}
