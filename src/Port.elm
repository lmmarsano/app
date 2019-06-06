port module Port exposing (InfoOut(..), InfoIn(..), output, input)

import Data.Type as DT
import Data.Decode as DD
import Data.Encode as DE
import Json.Decode as JD
import Json.Encode as JE

port infoOut : InfoGeneric -> Cmd msg

port infoIn : (InfoGeneric -> msg) -> Sub msg

type InfoOut
  = StoreSession DT.Seed
  | ClearSession
  | SetInvalid DT.Id String
  | ClearInvalid DT.Id
  | LogError String

type InfoIn
  = Invalid DT.Id String
  | Valid DT.Id

type alias InfoGeneric =
  { tag : String
  , data : JE.Value
  }

output : InfoOut -> Cmd msg
output info =
  infoOut
    <| case info of
         StoreSession seed ->
           InfoGeneric "StoreSession" <| DE.seed seed
         ClearSession ->
           InfoGeneric "ClearSession" JE.null
         SetInvalid id error ->
           InfoGeneric "SetInvalid"
             <| JE.object
               [ ("id", DE.id id)
               , ("error", JE.string error)
               ]
         ClearInvalid id ->
           InfoGeneric "ClearInvalid" <| DE.id id
         LogError error ->
           InfoGeneric "LogError" <| JE.string error

input : (InfoIn -> msg) -> (JD.Error -> msg) -> Sub msg
input okTagger errorTagger
  = infoIn
    <| \{tag, data} ->
      let
        maybeDecoder
          = case String.toLower tag of
              "valid" ->
                Just <| JD.map Valid DD.id
              "invalid" ->
                Just
                  <| JD.map2 Invalid
                    (JD.field "id" DD.id)
                  <| JD.field "error" JD.string
              _ ->
                Nothing
      in
        case maybeDecoder of
          Nothing ->
            errorTagger
            <| JD.Failure "Unexpected tag"
            <| JE.string tag
          Just decoder ->
            case JD.decodeValue decoder data of
              Ok dataOk ->
                okTagger dataOk
              Err error ->
                errorTagger error
