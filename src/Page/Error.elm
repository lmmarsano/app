module Page.Error exposing (Error, Model, view)

import Error exposing (..)
import Html exposing (Html, a, h1, main_, p, text)
import Html.Attributes exposing (class, href)
import Route



-- MODEL --


type Model
    = Model Error.Error



-- VIEW --


view : Model -> Html msg
view (Model error) =
    main_
        [ class "container" ]
        [ h1 [] [ text "Error" ]
        , p []
            [ text <| errorMessage error ]
        , a [ href <| Route.toString Route.Root ] [ text "Return home" ]
        ]



-- consider offering solutions as a list of links


errorMessage error =
    case error of
        None ->
            "No error."

        Init ->
            "Initialization has failed."

        EmptyId ->
            "ID is empty."

        NotFound ->
            "Destination is not found."

        NotAuthorized ->
            "The attempted destination requires log in."

        LoggedIn ->
            "Already logged in. Log out first to proceed."
