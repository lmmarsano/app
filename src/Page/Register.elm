module Page.Register exposing (Model, NameState(..), PasswordState(..), init, mainPassword, maybePasswordError, otherPassword, passwordView, update, view)

import Utility exposing (labelledInput, noCmd)
import Page.Register.Msg exposing (..)
import Msg as M
import NonEmptyString as NES exposing (NonEmptyString)
import Utility as U
import Browser exposing (Document)
import Html as H exposing (Html, Attribute)
import Html.Attributes as HA
import Html.Events as HE

type NameState
  = PendingName (Maybe String)
  | Taken NonEmptyString
  | Free NonEmptyString

type PasswordState
  = Pending (Maybe String) (Maybe String)
  | Show (Maybe String)
  | Match String
  | MisMatch String String

type alias Model =
  { name : NameState
  , password : PasswordState
  }

init =
  Model (PendingName Nothing) (Pending Nothing Nothing)

update : Msg -> Model -> ( Model, Cmd M.Msg )
update msg model =
  let
    newModel =
      case msg of
        NoOp ->
          model

        SetName name ->
          { model | name = PendingName (Just name) }

        ToggleShow show ->
          { model
          | password =
            if show then
              model.password |> mainPassword |> Show

            else
              case model.password |> mainPassword of
                Nothing ->
                  Pending Nothing Nothing

                Just password ->
                  Match password
          }

        SetPassword password ->
          { model
            | password =
              case model.password of
                Show _ ->
                  Show (Just password)

                _ ->
                  Pending (Just password) (otherPassword model.password)
          }

        SetConfirm password ->
          { model
            | password =
              Pending (mainPassword model.password) (Just password)
          }

        NextPassword ->
          case model.password of
            Pending (Just main) (Just other) ->
              { model
                | password =
                  if main == other then
                    Match main

                  else
                    MisMatch main other
              }

            _ ->
              model

        InfoIn _ ->
          model
  in
    noCmd newModel

onInput : (String -> Msg) -> Attribute M.Msg
onInput tag =
  HE.onInput <| M.Register << tag

onBlur : Msg -> Attribute M.Msg
onBlur =
  HE.onBlur << M.Register

view : Model -> Document M.Msg
view model =
  { title = "Register"
  , body =
      [ H.main_ []
          [ H.h1 [] [ H.text "Register" ]
          , H.form [ HE.onSubmit <| M.Register NoOp ]
            <| labelledInput "name"
              [ H.text "Name" ]
              [ HA.required True
              , onInput SetName
              , HA.attribute "autocomplete" "username"
              ]
            ++ [ passwordView model.password
               , H.button [] [ H.text "Submit" ]
               ]
          ]
      ]
  }

passwordView : PasswordState -> Html M.Msg
passwordView passwordState =
  let
    {maybeMain, maybeChecked, maybeOnBlur, maybeOther, maybeError} =
      let
        viewState =
          { maybeMain = mainPassword passwordState
          , maybeChecked = Nothing
          , maybeOnBlur = Nothing
          , maybeOther = Nothing
          , maybeError = Nothing
          }
      in
        case passwordState of
          Show _ ->
            { viewState
            | maybeChecked = Just <| HA.checked True
            }

          _ ->
            { viewState
            | maybeOnBlur = Just <| onBlur NextPassword
            , maybeOther = otherPassword passwordState
            , maybeError =
              maybePasswordError
              [ [ H.small
                    [ HA.class "form-error"
                    , HA.id "password-error"
                    , HA.attribute "aria-live" "polite"
                    ]
                    [ H.text "Passwords do not match." ]
                ]
              ]
              passwordState
            }
  in
    H.fieldset
    (U.maybeConsFold
      [ Just <| HA.attribute "aria-errormessage" "password-error"
      , maybePasswordError (HA.attribute "aria-invalid" "true") passwordState
      ]
    )
  <| ((::) <| H.legend [] [ H.text "Password" ])
  <| List.concat
  <| U.appendMaybe
    [ labelledInput "show-password"
        [ H.text "Show" ]
        <| U.maybeCons maybeChecked
            [ HA.type_ "checkbox"
            , HE.onCheck <| M.Register << ToggleShow
            ]
    , labelledInput "password"
        [ H.text "Password" ]
        <| U.maybeCons (Maybe.map HA.value maybeMain)
        <| U.maybeCons maybeOnBlur
        <| U.maybeCons (U.maybeAlways (HA.type_ "password")
                       <| U.maybeInvert maybeChecked
                       )
            [ HA.required True
            , onInput SetPassword
            , HA.attribute "autocomplete" "new-password"
            ]
    ]
  (U.maybeAlways
     (U.appendMaybe
        [ labelledInput "confirm-password"
            [ H.text "Confirm" ]
            <| U.maybeCons (Maybe.map HA.value maybeOther)
              [ HA.required True
              , HA.type_ "password"
              , onInput SetConfirm
              , onBlur NextPassword
              , HA.attribute "autocomplete" "new-password"
              ]
        ]
        maybeError
     )
     maybeOnBlur
  )

mainPassword : PasswordState -> Maybe String
mainPassword passwordState =
  case passwordState of
    Pending maybePassword _ ->
      maybePassword

    Show maybePassword ->
      maybePassword

    Match password ->
      Just password

    MisMatch password _ ->
      Just password

otherPassword : PasswordState -> Maybe String
otherPassword passwordState =
  case passwordState of
    Pending _ maybePassword ->
      maybePassword

    Match password ->
      Just password

    MisMatch _ password ->
      Just password

    _ ->
      Nothing

maybePasswordError : a -> PasswordState -> Maybe a
maybePasswordError value passwordState =
  case passwordState of
    MisMatch _ _ ->
      Just value

    _ ->
      Nothing
