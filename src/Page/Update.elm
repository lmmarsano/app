module Update exposing (update)

import Model exposing (..)
import Msg exposing (..)
import Utility exposing (..)


update : Msg -> Model -> ( Model, Cmd Msg )
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
    in
    ( newModel, Cmd.none )
