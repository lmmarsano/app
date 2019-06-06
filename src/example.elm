module Main exposing (..)

import Browser
import Browser.Navigation as Nav
import Html exposing (..)
import Html.Attributes exposing (..)
import Url exposing (Url)
import Url.Parser exposing (Parser, (</>), int, map, oneOf, s, string, parse)

main : Program () Model Msg
main =
  Browser.application
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    , onUrlChange = UrlChanged
    , onUrlRequest = LinkClicked
    }

type alias Model =
  { key : Nav.Key
  , route : Route
  }

init : () -> Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
  ( Model key <| routeFromUrl url, Cmd.none )

type Msg
  = LinkClicked Browser.UrlRequest
  | UrlChanged Url

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
  case msg of
    LinkClicked routeRequest ->
      case routeRequest of
        Browser.Internal route ->
          ( model, Nav.pushUrl model.key (Url.toString route) )

        Browser.External href ->
          ( model, Nav.load href )

    UrlChanged url ->
      ( { model | route = routeFromUrl url }
      , Cmd.none
      )

subscriptions : Model -> Sub Msg
subscriptions _ =
  Sub.none

view : Model -> Browser.Document Msg
view model =
  { title = "URL Interceptor"
  , body =
      [ text "The current URL is: "
      , b [] [ text <| routeToString model.route ]
      , ul [] <|
          List.map viewLink
            [ "/home"
            , "/profile"
            , "/reviews/the-century-of-the-self"
            , "/reviews/public-opinion"
            , "/reviews/shah-of-shahs"
            , "https://elm-lang.org"
            ]
      ]
  }

viewLink : String -> Html msg
viewLink path =
  li [] [ a [ href path ] [ text path ] ]

type Route
  = Home
  | Profile
  | Reviews String
  | RouteError String

routeParser : Parser (Route -> b) b
routeParser =
  oneOf
    [ map Home <| s "home"
    , map Profile <| s "profile"
    , map Reviews <| s "reviews" </> string
    ]

routeFromUrl : Url -> Route
routeFromUrl url =
  parse routeParser url
    |> Maybe.withDefault (RouteError url.path)

routeToString : Route -> String
routeToString route =
  (case route of
    Home -> ["home"]
    Profile -> ["profile"]
    Reviews title -> ["reviews", title]
    RouteError path ->
     String.split "/" path
     |> List.filter (not << String.isEmpty)
  ) |> String.join "/" |> (++) "/"
