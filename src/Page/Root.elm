module Root exposing (view)

import Session exposing (Session)
import Data.Type as DT
import Html exposing (Html, a, h1, main_, p, text)
import Html.Attributes exposing (class, href)

-- VIEW --

view : Session -> Html msg
view session =
  let
    body =
      case session of
        Nothing ->
          [ text "Please log in." ]

        Just user ->
          [ text <| DT.nENameToString user.name ]
  in
    main_
      [ class "container" ]
      [ h1 [] [ text "Welcome" ]
      , p [] body
      ]
