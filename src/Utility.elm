module Utility exposing (appendMaybe, cmd, labelledInput, maybeAlways, maybeCons, maybeConsFold, maybeInvert, maybeJoin, noCmd)

import Html as H exposing (Html, Attribute)
import Html.Attributes as HA

noCmd : model -> (model, Cmd msg)
noCmd model =
  (model, Cmd.none)

cmd : model -> List (Cmd msg) -> (model, Cmd msg)
cmd model list =
  (model, Cmd.batch list)

maybeInvert : Maybe a -> Maybe ()
maybeInvert maybe =
  case maybe of
    Nothing ->
      Just ()

    Just _ ->
      Nothing

maybeJoin : Maybe (Maybe a) -> Maybe a
maybeJoin maybe =
  case maybe of
    Just value ->
      value

    Nothing ->
      Nothing

maybeAlways : b -> Maybe a -> Maybe b
maybeAlways =
  always >> Maybe.map

maybeCons : Maybe a -> List a -> List a
maybeCons maybeHead list =
  case maybeHead of
    Nothing ->
      list

    Just value ->
      value :: list

appendMaybe : appendable -> Maybe appendable -> appendable
appendMaybe list maybeList =
  case maybeList of
    Nothing ->
      list

    Just aList ->
      list ++ aList

maybeConsFold : List (Maybe a) -> List a
maybeConsFold =
  List.filterMap identity

labelledInput : String -> List (Html msg) -> List (Attribute msg) -> List (Html msg)
labelledInput idText labelContent inputAttributes =
  [ H.label [ HA.for idText ] labelContent
  , H.input (HA.id idText :: inputAttributes) []
  ]

{-
   errorMessage : Http.Error -> String
   errorMessage error =
     case error of
       Http.BadUrl url ->
         "invalid URL" ++ url

       Http.Timeout ->
         "response timed out"

       Http.NetworkError ->
         "no network connectivity"

       Http.BadStatus { status } ->
         "bad status "
           ++ toString status.code
           ++ """

          """
           ++ status.message

       Http.BadPayload code _ ->
         """
         bad payload
         """
           ++ "status "
           ++ code
-}
