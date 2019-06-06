module Target exposing (Target(..), fromUrl, fromString, isRelative, isSegment, resolve, toSegments, toString, encode)

import Url exposing (Url)
import Url.Builder as UB
import Json.Encode as JE exposing (Value)

type Target
  = Relative (List String)
  | Absolute (List String)

fromUrl : Url -> Target
fromUrl =
  .path >> fromString

fromString : String -> Target
fromString string =
  let
    segments =
      (String.split "/" string
      |> List.filter (not << String.isEmpty)
      |> UB.relative
      )
        []
        |> String.split "/"
  in
  (if String.startsWith "/" string then
     Absolute

   else
     Relative
  )
    segments

resolve : Target -> Target -> Target
resolve url0 url1 =
  case url1 of
    Absolute _ ->
      url1

    Relative list1 ->
      case url0 of
        Absolute list0 ->
          Absolute <| list0 ++ list1

        Relative list0 ->
          Relative <| list0 ++ list1

toSegments : Target -> List String
toSegments target =
  case target of
    Relative list -> list
    Absolute list -> list

toString : Target -> String
toString url =
  case url of
    Relative list ->
      UB.relative list []

    Absolute list ->
      UB.absolute list []

encode : Target -> Value
encode =
  toString >> JE.string

isSegment : Target -> Bool
isSegment url =
  case url of
    Relative [ _ ] ->
      True

    _ ->
      False

isRelative : Target -> Bool
isRelative url =
  case url of
    Relative _ ->
      True

    _ ->
      False
