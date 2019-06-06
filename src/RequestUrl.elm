module RequestUrl exposing (RequestUrl(..), toTarget)

import Data.Type as DT
import Target as T exposing (Target)
import NonEmptyString exposing (NonEmptyString)

type RequestUrl
  = Users
  | User DT.NEName
  | Session
  | Containers
  | Container Target
  | Data DT.Data
  | Resource Target DT.Name

toTarget url =
  let
    segments =
      case url of
        Users ->
          [ "user" ]

        User nEName ->
          [ "user", DT.nENameToString nEName ]

        Session ->
          [ "session" ]

        Containers ->
          [ "container" ]

        Container target ->
          "container" :: T.toSegments target

        Data key ->
          [ "data", DT.dataToString key ]

        _ ->
          []
  in
    case url of
      Resource target name ->
        T.resolve target
          <| T.fromString name

      _ ->
        T.fromString
          <| String.join "/"
          <| "" :: "api" :: segments
