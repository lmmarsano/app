module Page.Register.Msg exposing (..)
import Port exposing (InfoIn(..))

type Msg
  = SetName String
  | SetPassword String
  | SetConfirm String
  | NextPassword
  | ToggleShow Bool
  | InfoIn InfoIn
  | NoOp
