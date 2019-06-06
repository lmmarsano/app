module Msg exposing (Msg(..))

import Data.Type exposing (Session, Seed)
import Port as P
import Page.Register.Msg as PRM
import Page.LogIn.Msg as PLM
import Browser exposing (UrlRequest)
import Url exposing (Url)
import Json.Decode as JD

type Msg
  = InitSession (Result JD.Error Seed)
  | UrlRequest UrlRequest
  | UrlChange Url
  | SetSession Session
  | LogIn PLM.Msg
  | LogOut
  | Register PRM.Msg
  | PortError JD.Error
  | PortInfo P.InfoIn
  | ToDo String
