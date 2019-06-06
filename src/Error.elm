module Error exposing (Error(..))

type Error
    = None
    | Init
    | EmptyId
    | NotFound
    | NotAuthorized
    | LoggedIn
