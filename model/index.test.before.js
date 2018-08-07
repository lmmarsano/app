'use strict'
const intoStream = require('into-stream')
    , s2p = require('stream-to-promise')
    , fetcherFactory = (string) => () => intoStream(string)
    , init = async ({User, Container, Resource, Data}) => {
	    const s2d = (string) => Data.createFromSource(intoStream(string))
	        , [ dataItems
	          , reData
	          , [{_id: userId}]
	          ] = await Promise.all
	    ([ Promise.all(['data0', 'data1'].map(s2d))
	     , s2d('reData')
	     , User.create
	       ([{ name: 'name'
	         , password: 'password'
	         }])
	     ])
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
	        , [ [{_id: resourceId}]
	          , [{_id: reResourceId}]
	          ] = await Promise.all
	    ([ Resource.create
	       (await Promise
	              .all(dataItems
	                   .map(async (data) => ({ container: containerId
	                                      , name: (await s2p(data.getDownloadStream()))
	                                              .toString()
	                                      , data: data.md5
	                                      , type: 'text/plain'
	                                      })
	                     )
	                  )
	       )
	     , Resource.create
	       ([0, 1]
	       .map((index) => ({ container: reContainerId
	                     , name: 'reuse' + index
	                     , data: reData.md5
	                     , type: 'text/plain'
	                     })
	         )
	       )
	     ])
	    reData.refCount++
	    await reData.save()
	    return {userId, containerId, conContainerId, reContainerId, resourceId, reResourceId, dataKey: dataItems[0].md5, reDataKey: reData.md5, fetcherFactory}
    }
module.exports = init
