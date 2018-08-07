'use strict'
const {createGunzip, createInflate} = require('zlib')
    , debug = require('debug')('koa:decompress')
    , toTokens = (field) => field.toLowerCase().split(',').map((e) => e.trim())
    , getDecodedReq = (ctx, {transferOnly, zlib} = {}) => {
	    const encodings = [ ...( transferOnly
	                           ? []
	                           : ['content']
	                           )
	                      , 'transfer'
	                      ]
	                      .reduce((acc, base) => {
		                      const encodings = ctx.request.headers[base + '-encoding']
		                      return encodings
		                           ? acc.concat(toTokens(encodings))
		                           : acc
	                      }
	                             , []
	                             )
	    debug('stream encodings %O', encodings)
	    return encodings
	           .reduce( (acc, val) => {
		           switch (val) {
			           case 'gzip':
			           acc.unshift(createGunzip(zlib))
			           break
			           case 'deflate':
			           acc.unshift(createInflate(zlib))
			           break
			           default:
			           debug('unhandled encoding %s', val)
		           }
		           return acc
	           }
	                  , []
	                  )
	           .reduce( (acc, val) => acc.pipe(val)
	                  , ctx.req
	                  )
    }
    , middleware = (options) => {
	    const decompress = (ctx, next) => {
		    ctx.state.incoming = getDecodedReq(ctx, options)
		    return next()
	    }
	    return decompress
    }

module.exports = middleware
