module Page.Root exposing (view)

import Data.Type exposing (..)
import Html exposing (Html, a, button, div, h1, header, li, nav, p, text, ul)
import Html.Attributes exposing (class, href)
import Html.Events exposing (onClick)
import Msg exposing (..)
import Route
import Session exposing (..)



-- VIEW --


view : Session -> Html msg
view session body =
    let
        controls =
            case session of
                None ->
                    [ Route.toLink Route.Register
                    , Route.toLink Route.Login
                    ]

                _ ->
                    [ button [ onClick LogOut ] [ text "Log Out" ] ]
    in
    div [ class "layout" ]
        [ header []
            [ h1 [] [ text "Content Manager" ]
            , ul [ class "control" ] <| List.map (li []) controls
            ]
        , body
        ]
