'use strict'
const debug = require('debug')('app:controller.data')
    , controller = ({Data}) => {
	    // parameters: models & relative paths between resources
	    const read = async (ctx, next) => {
		        const {key} = ctx.params
		            , data = await Data.findByKey(key)
		        ctx.response.body = data
		                         || ctx.throw( 404    // Not Found
		                                     , 'Data not found.'
		                                     )
		        debug('read data %s', key)
	        }
	    return {data: {read}}
}
module.exports = controller
