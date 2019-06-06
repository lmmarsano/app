module View exposing (view)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode as Decode
import Model exposing (..)
import Msg exposing (..)
import NonEmptyString as NES exposing (NonEmptyString)
import Utility exposing (..)


view : Model -> Html Msg
view model =
    main_ []
        [ h1 [] [ text "Register" ]
        , Html.form [ onSubmit NoOp ] <|
            labelledInput
                "name"
                [ text "Name" ]
                [ required True
                , onInput SetName
                ]
                ++ [ passwordView model.password
                   , button [] [ text "Submit" ]
                   ]
        ]


passwordView : PasswordState -> Html Msg
passwordView passwordState =
    let
        maybeShow =
            case passwordState of
                Show _ ->
                    { maybeMain =
                        Nothing
                    , maybeChecked =
                        Just <| checked True
                    , maybeOnBlur =
                        Nothing
                    , maybeOther =
                        Nothing
                    , maybeError =
                        Nothing
                    }

                _ ->
                    { maybeMain =
                        Nothing
                    , maybeChecked =
                        Nothing
                    , maybeOnBlur =
                        Just <| onBlur NextPassword
                    , maybeOther =
                        otherPassword passwordState
                    , maybeError =
                        maybePasswordError
                            [ [ small
                                    [ class "form-error"
                                    , id "password-error"
                                    , attribute "aria-live" "polite"
                                    ]
                                    [ text "Passwords do not match." ]
                              ]
                            ]
                            passwordState
                    }

        viewState =
            { maybeShow | maybeMain = mainPassword passwordState }
    in
    fieldset
        (maybeConsFold
            [ Just <| attribute "aria-errormessage" "password-error"
            , maybePasswordError (attribute "aria-invalid" "true") passwordState
            ]
        )
    <|
        ((::) <| legend [] [ text "Password" ]) <|
            List.concat <|
                appendMaybe
                    [ labelledInput
                        "show-password"
                        [ text "Show" ]
                      <|
                        maybeCons
                            viewState.maybeChecked
                            [ type_ "checkbox"
                            , onCheck ToggleShow
                            ]
                    , labelledInput
                        "password"
                        [ text "Password" ]
                      <|
                        maybeCons
                            (Maybe.map value viewState.maybeMain)
                        <|
                            maybeCons
                                viewState.maybeOnBlur
                                [ required True
                                , type_ "password"
                                , onInput SetPassword
                                ]
                    ]
                    (maybeAlways
                        (appendMaybe
                            [ labelledInput
                                "confirm-password"
                                [ text "Confirm" ]
                              <|
                                maybeCons
                                    (Maybe.map value viewState.maybeOther)
                                    [ required True
                                    , type_ "password"
                                    , onInput SetConfirm
                                    , onBlur NextPassword
                                    ]
                            ]
                            viewState.maybeError
                        )
                        viewState.maybeOnBlur
                    )


labelledInput : String -> List (Html msg) -> List (Attribute msg) -> List (Html msg)
labelledInput idText labelContent inputAttributes =
    [ label [ for idText ] labelContent
    , input (id idText :: inputAttributes) []
    ]
