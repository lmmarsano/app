module Main exposing (..)

import Utility exposing (noCmd, cmd)
import Msg exposing (..)
import Port as P
import Session exposing (setSession, toSeed)
import Route as R exposing (Path, fromUrl, toTarget)
import Page exposing (Page, view)
import Target as T exposing (Target)
import RequestUrl as RU exposing (RequestUrl(..))
import Data.Type as DT exposing(Session, Seed)
import Data.Decode as DD
import Page.Register as PR
import Json.Decode as JD exposing (Value)
import Browser as B exposing (UrlRequest, Document)
import Browser.Navigation as Nav exposing (Key)
import Url exposing (Url)
import Html exposing (Html, a, button, h1, header, main_, ul, li, p, text)
import Html.Attributes exposing (class, href)
import Html.Events exposing (onClick)
import Http as H

{-
   register
   login
   containers & resources
   edit container
   edit resource
-}

main : Program Value Model Msg
main =
  B.application
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    , onUrlChange = UrlChange
    , onUrlRequest = UrlRequest
    }

-- model

type Model
  = Pending Nav.Key Path
  | Model Nav.Key Session Page

init : Value -> Url -> Key -> (Model, Cmd Msg)
init json url key =
  update (InitSession <| toSeed json)
    <| Pending key
    <| fromUrl url

-- update

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case model of
    Model key session page ->
      case msg of
        SetSession nextSession ->
          cmd model [ setSession nextSession ]

        UrlRequest urlRequest ->
          case urlRequest of
            B.Internal url ->
              case fromUrl url of
                R.Error target ->
                  cmd model [ Nav.load <| T.toString target ]
                path ->
                  cmd model [ R.pushUrl key path ]

            B.External string ->
              cmd model [ Nav.load string ]

        UrlChange url ->
          setPath (fromUrl url) key session page

        LogIn _ ->
          let
            (nextPage, newMsg) = Page.update msg page
          in
            cmd (Model key session nextPage) [newMsg]

        Register _ ->
          let
            (nextPage, newMsg) = Page.update msg page
          in
            cmd (Model key session nextPage) [newMsg]

        PortError error ->
          ( model
          , P.output
            <| P.LogError
            <| JD.errorToString error
          )

        _ ->
          Debug.log (String.join " "
                       [ "update unhandled case"
                       , Debug.toString msg
                       ])
            noCmd model

    Pending key path ->
      case msg of
        InitSession resultSeed ->
          initSession resultSeed key path

        SetSession session ->
          setPath path key session Page.Pending

        _ ->
          noCmd model

initSession : Result JD.Error Seed -> Key -> Path -> (Model, Cmd Msg)
initSession resultSeed key path =
  case resultSeed of
    Ok name ->
      cmd (Pending key path)
        [ H.get
            (T.toString <| RU.toTarget <| RU.User name)
            DD.user
        |> H.send (Result.toMaybe >> SetSession)
        ]

    _ ->
      setPath path key Nothing Page.Pending

setPath : Path -> Key -> Session -> Page -> (Model, Cmd Msg)
setPath path key session page =
  noCmd
    <| Model key session
    <| Page.model path session


-- subscriptions

subscriptions : Model -> Sub Msg
subscriptions model =
  case model of
    Model _ _ page ->
      Page.subscriptions page

    _ ->
      Sub.none

-- view

view : Model -> Document Msg
view model =
  case model of
    Pending _ _ ->
      { title = "Pending"
      , body = []
      }
    Model key session page ->
      let controls =
            case session of
              Nothing ->
                [ R.toLink R.Register [] [ text "Register" ]
                , R.toLink R.LogIn [] [ text "Log In" ]
                ]

              _ ->
                [ button [ onClick LogOut ] [ text "Log Out" ] ]

          {title, body} = Page.view session page
      in { title
             = [title, "Content Manager"]
         |> List.filter (not << String.isEmpty)
         |> String.join " "
         , body
             = [ header []
                   [ h1 [] [ text "Content Manager" ]
                   , ul [ class "control" ] <| List.map (li [] << List.singleton) controls
                   ]
               ]
             ++ body
         }
