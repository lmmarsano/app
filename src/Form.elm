module Main exposing (CheckedPart(..), Constraint, Id, Label, Part(..), Validation(..), ValidationResult, Value, applyConstraints, toCheckedPart, toInvalid, toPart, toPartDict, toValid, validate)

import Dict as D exposing (Dict)


type alias Label =
    String


type alias Id =
    String


type alias Value =
    String


type alias Constraint target err =
    target -> Maybe err


applyConstraints target =
    List.filterMap <| (|>) target


type Part err
    = Part (Maybe Label) (List Part) (List (Constraint (Dict Id Value) err)) (Dict Id Value)
    | Field Label Id Value (List (Constraint Value err))


type CheckedPart err
    = CheckedPart (Maybe Label) (List (CheckedPart err)) (List err)
    | CheckedField Label (List err) Id Value


toPartDict =
    List.foldr
        (\value accumulator ->
            case value of
                Field _ id value _ ->
                    D.insert id value accumulator

                Part _ _ _ value ->
                    D.union value accumulator
        )
        D.empty


toPart maybeLabel listPart listConstraint =
    Part maybeLabel listPart listConstraint <|
        toPartDict listPart


type Validation err a
    = Validation (CheckedPart err)


toValid : CheckedPart err -> Validation err Valid
toValid =
    Validation


toInvalid : CheckedPart err -> Validation err Invalid
toInvalid =
    Validation


type alias ValidationResult err =
    Result (Validation err Invalid) (Validation err Valid)


toCheckedPart validationResult =
    case validationResult of
        Ok (Validation checkedPart) ->
            checkedPart

        Err (Validation checkedPart) ->
            checkedPart


validate part =
    case part of
        Field label id value constraintList ->
            let
                errorList =
                    applyConstraints value constraintList
            in
            (if List.isEmpty errorList then
                Ok << toValid

             else
                Err << toInvalid
            )
            <|
                CheckedField
                    label
                    id
                    value
                    errorList

        Part labelMaybe partList constraintList value ->
            let
                errorList =
                    applyConstraints value constraintList

                resultList =
                    List.map validate partList
            in
            (if List.all <| List.map (Result.map (always True) >> Result.withDefault False) resultList then
                Ok << toValid

             else
                Err << toInvalid
            )
            <|
                CheckedPart
                    labelMaybe
                    (List.map toCheckedPart resultList)
                    errorList
