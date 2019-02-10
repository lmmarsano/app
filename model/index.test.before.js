'use strict'
const intoStream = require('into-stream')
    , getStream = require('get-stream')
    , fetcherFactory = (string) => () => intoStream(string)
    , init = async ({User, Container, Resource, Data}) => {
	    const [{_id: userId}] = await User.create
	    ([{ name: 'name'
	      , password: 'password'
	      }])
	        , [ {_id: containerId}
	          , {_id: conContainerId}
	          , {_id: reContainerId}
	          ] = await Container.create
	    ([ { assignedTo: userId
	       , url: '/distinct'
	       }
	     , { assignedTo: userId
	       , url: '/distinct/conflict'
	       }
	     , { assignedTo: userId
	       , url: '/reuse'
	       }
	     ])
	        , resourceDoc = (container) => (name) => Resource.add
	    ( { container
	      , name
	      , data: name
	      }
	    , fetcherFactory(name)
	    )
	        , [ {data: reDataKey}
	          , { _id: resourceId
	            , data: dataKey
	            }
	          ] = await Promise
	                    .all([resourceDoc(reContainerId)('reData')]
	                         .concat(['data0', 'data1']
	                                 .map(resourceDoc(containerId))
	                                )
	                        )
	        , {_id: reResourceId} = await Resource.add
	    ({ container: reContainerId
	     , name: 'reDataDuplicate'
	     , data: reDataKey
	     })
	    return {userId, containerId, conContainerId, reContainerId, resourceId, reResourceId, dataKey, reDataKey, fetcherFactory}
    }
module.exports = init
