module NonEmptyString exposing (NonEmptyString, fromString, toString)

type NonEmptyString = NonEmptyString String

toString : NonEmptyString -> String
toString (NonEmptyString string) =
  string

fromString : String -> Maybe NonEmptyString
fromString string =
  if String.isEmpty string then
    Nothing
  else
    Just <| NonEmptyString string
