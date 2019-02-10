'use strict'
const debug = require('debug')('app:controller.data')
    , controller = ({Data}) => {
	    // parameters: models & relative paths between resources
	    const read = async (ctx, next) => {
		    const {key} = ctx.params
		        , data = await Data.findByKey(key)
		    if (data) {
			    ctx.response.body = data
			    debug('read data %s', key)
		    }
	    }
	    return {data: {read}}
}
module.exports = controller
