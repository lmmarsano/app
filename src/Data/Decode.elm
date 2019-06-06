module Data.Decode exposing (container, data, id, mediaType, nEName, name, nonEmptyString, resource, url, user, seed)

import Data.Type exposing (..)
import Json.Decode as D
import Json.Decode.Pipeline exposing (required)
import NonEmptyString as NES exposing (NonEmptyString)
import Target as T exposing (Target)

user : D.Decoder User
user =
  D.succeed User
    |> required "_id" id
    |> required "name" nEName
    |> required "containers" (D.list container)

container : D.Decoder Container
container =
  D.succeed Container
    |> required "_id" id
    |> required "url" url
    |> required "resources" (D.list resource)

resource : D.Decoder Resource
resource =
  D.succeed Resource
    |> required "_id" id
    |> required "name" name
    |> required "type" mediaType
    |> required "data" data

id : D.Decoder Id
id =
  nonEmptyString

name : D.Decoder Name
name =
  D.string

nEName : D.Decoder NEName
nEName =
  nonEmptyString

mediaType : D.Decoder MediaType
mediaType =
  nonEmptyString

data : D.Decoder Data
data =
  nonEmptyString

nonEmptyString : D.Decoder NonEmptyString
nonEmptyString =
  D.andThen
    (NES.fromString
      >> Maybe.map D.succeed
      >> Maybe.withDefault (D.fail "string is empty")
    )
    D.string

url : D.Decoder Target
url =
  D.map T.fromString D.string

seed : D.Decoder Seed
seed
  = nEName
