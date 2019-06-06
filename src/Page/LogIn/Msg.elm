module Page.LogIn.Msg exposing (Msg(..))

type Msg
  = SetName String
  | SetPassword String
  | ShowPassword Bool
