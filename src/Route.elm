module Route exposing (Path(..), fromUrl, pushUrl, replaceUrl, toLink, toTarget)

import Target as T exposing (Target)
import Data.Type exposing (Container, Id, Resource, User, idToString, maybeIdFromString)
import Html exposing (Html, Attribute, a)
import Html.Attributes exposing (href)
import Url exposing (Url)
import Url.Parser as UP exposing ((</>), Parser, custom, oneOf, parse, s, string)
import Browser.Navigation as BN

type Path
  = Root
  | Register
  | LogIn
  | EditUser
  | EditContainer Id
  | EditResource Id
  | Error Target

parser : Parser (Path -> c) c
parser =
  oneOf
  <| [ UP.map Root UP.top
     , UP.map Register
       <| s "register"
     , UP.map LogIn
       <| s "login"
     , UP.map EditUser
       <| s "edit" </> s "user"
     , UP.map EditContainer
       <| s "edit" </> s "container" </> id
     , UP.map EditResource
       <| s "edit" </> s "resource" </> id
     ]

fromUrl : Url -> Path
fromUrl url =
  parse parser url
    |> Maybe.withDefault (Error <| T.fromUrl url)

toTarget : Path -> Target
toTarget path =
  let
    segments =
      case path of
        Root ->
          []

        Register ->
          [ "register" ]

        LogIn ->
          [ "login" ]

        EditUser ->
          [ "edit"
          , "user"
          ]

        EditContainer containerId ->
          [ "edit"
          , "container"
          , idToString containerId
          ]

        EditResource resourceId ->
          [ "edit"
          , "resource"
          , idToString resourceId
          ]

        Error _ ->
          []
  in
    case path of
      Error target ->
        target
      _ ->
        T.Relative segments

toString : Path -> String
toString =
  toTarget >> T.toString

replaceUrl : BN.Key -> Path -> Cmd msg
replaceUrl key =
  toString >> BN.replaceUrl key

pushUrl : BN.Key -> Path -> Cmd msg
pushUrl key =
  toString >> BN.pushUrl key

id : Parser (Id -> a) a
id =
  custom "Id" maybeIdFromString

toLink : Path -> List (Attribute msg) -> List (Html msg) -> Html msg
toLink path attributes =
  a <| (href <| toString path) :: attributes
