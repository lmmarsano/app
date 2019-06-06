module Data.Encode exposing (container, data, id, mediaType, nEName, name, resource, user, seed)

import Data.Type as DT
import Target as T
import Json.Encode as JE exposing (Value)

data : DT.Data -> Value
data
  = DT.dataToString >> JE.string

id : DT.Id -> Value
id
  = DT.idToString >> JE.string

mediaType : DT.MediaType -> Value
mediaType
  = DT.mediaTypeToString >> JE.string

nEName : DT.NEName -> Value
nEName
  = DT.nENameToString >> JE.string

name : DT.Name -> Value
name
  = DT.nameToString >> JE.string

resource : DT.Resource -> Value
resource record
  = JE.object
    [ ("_id", id record.id)
    , ("name", name record.name)
    , ("type", mediaType record.mediaType)
    , ("data", data record.data)
    ]

container : DT.Container -> Value
container record
  = JE.object
    [ ("_id", id record.id)
    , ("url", T.encode record.url)
    , ("resources", JE.list resource record.resources)
    ]

user : DT.User -> Value
user record
  = JE.object
    [ ("_id", id record.id)
    , ("name", nEName record.name)
    , ("containers", JE.list container record.containers)
    ]

seed : DT.NEName -> Value
seed
  = nEName
