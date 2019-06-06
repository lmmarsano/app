module Data.Type exposing (Container, Data, Id, MediaType, NEName, Name, Resource, User, Session, Seed, dataToString, idToString, maybeIdFromString, mediaTypeToString, nENameToString, nameToString)

import NonEmptyString as NES exposing (NonEmptyString)
import Target exposing (Target)

type alias Id
  = NonEmptyString

type alias Name
  = String

type alias NEName
  = NonEmptyString

type alias MediaType
  = NonEmptyString

type alias Data
  = NonEmptyString

type alias User =
  { id : Id
  , name : NEName
  , containers : List Container
  }

type alias Container =
  { id : Id
  , url : Target
  , resources : List Resource
  }

type alias Resource =
  { id : Id
  , name : Name
  , mediaType : MediaType
  , data : Data
  }

type alias Session
  = Maybe User

type alias Seed
  = NEName

maybeIdFromString : String -> Maybe Id
maybeIdFromString =
  NES.fromString

idToString : Id -> String
idToString =
  NES.toString

nameToString : Name -> String
nameToString =
  identity

nENameToString : NEName -> String
nENameToString =
  NES.toString

dataToString : Data -> String
dataToString =
  NES.toString

mediaTypeToString : MediaType -> String
mediaTypeToString =
  NES.toString
