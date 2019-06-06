module Page.LogIn exposing (Model, init, update, view)

import Page.LogIn.Msg exposing (Msg(..))
import Utility exposing (labelledInput, noCmd)
import Msg as M
import NonEmptyString as NES exposing (NonEmptyString)
import Utility as U
import Browser exposing (Document)
import Html as H exposing (Html, Attribute)
import Html.Attributes as HA
import Html.Events as HE

{-
on incorrect login, go to error page
correct login goes to main page
name required
-}

type NameState
  = NamePending
  | NameEmpty
  | Name NonEmptyString

type alias Model
  = { name : NameState
    , show : Bool
    , password : String
    }

init
  = Model NamePending False ""

update : Msg -> Model -> ( Model, Cmd M.Msg )
update msg model =
  let newModel
        = case msg of
            SetName name ->
              { model | name
                  = NES.fromString name
              |> Maybe.map Name
              |> Maybe.withDefault NameEmpty
              }

            ShowPassword show ->
              { model | show = show }

            SetPassword password ->
              { model | password = password }
  in noCmd newModel

onInput : (String -> Msg) -> Attribute M.Msg
onInput tag =
  HE.onInput <| M.LogIn << tag

onBlur : Msg -> Attribute M.Msg
onBlur =
  HE.onBlur << M.LogIn

view : Model -> Document M.Msg
view model =
  let
    maybeName
      = case model.name of
          Name nonempty ->
            Just
            <| HA.value
            <| NES.toString nonempty
          _ ->
            Nothing

    nameErrors
      = case model.name of
          NameEmpty ->
            [ "A name is required." ]
          _ ->
            []

    {maybeChecked, maybeShow}
      = if model.show
        then { maybeChecked = Just <| HA.checked True
             , maybeShow = Nothing
             }
        else { maybeChecked = Nothing
             , maybeShow = Just <| HA.type_ "password"
             }

    maybePassword
      = if String.isEmpty model.password
        then Nothing
        else Just <| HA.value model.password
  in
    { title = "Login"
    , body
        = [ H.main_ []
              [ H.h1 [] [ H.text "Login" ]
              , H.form [ HE.onSubmit <| M.ToDo "Page.LogIn.view onSubmit" ]
                  <| inputControl "name"
                    [ H.text "Name" ]
                    (U.maybeCons maybeName
                       [ HA.required True
                       , onInput SetName
                       , HA.attribute "autocomplete" "username"
                       ])
                    nameErrors
                  ++ [ H.fieldset []
                         <| H.legend [] [ H.text "Password" ]
                           :: ( labelledInput "show-password"
                                  [ H.text "Show" ]
                                  (U.maybeCons maybeChecked
                                     [ HA.type_ "checkbox"
                                     , HE.onCheck
                                       <| M.LogIn
                                       << ShowPassword
                                     ])
                                  ++ (labelledInput "password"
                                        [ H.text "Password" ]
                                        <| U.maybeCons maybeShow
                                        <| U.maybeCons maybePassword
                                          [ onInput SetPassword
                                          , HA.attribute "autocomplete" "current-password"
                                          ]))
                     , H.button [] [ H.text "Submit" ]
                     ]
              ]
          ]
    }

inputControl id labelBody attributeList errorList
  = let {errorSection, errorAttributes}
          = if List.isEmpty errorList
            then { errorSection = []
                 , errorAttributes = []
                 }
            else
              let
                errorId = id ++ "-error"
              in { errorSection
                     = [ H.ul
                           [ HA.id errorId
                           , HA.class "form-error"
                           , HA.attribute "aria-live" "polite"
                           ]
                           <| List.map (H.li []
                                          << List.singleton
                                          << H.text
                                       )
                             errorList
                       ]
                 , errorAttributes
                     = [ HA.attribute "aria-errormessage" errorId
                       , HA.attribute "aria-invalid" "true"
                       ]
                 }
    in labelledInput id labelBody
         (attributeList ++ errorAttributes)
       ++ errorSection
