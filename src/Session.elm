module Session exposing (setSession, toSeed)

import Port exposing (InfoOut(..), output)
import Data.Type as DT exposing (Session, Seed)
import Data.Decode as DD
import Json.Encode as JE
import Json.Decode as JD

setSession : Session -> Cmd msg
setSession =
  Maybe.map (.name >> StoreSession)
    >> Maybe.withDefault ClearSession
    >> output

toSeed : JE.Value -> Result JD.Error Seed
toSeed =
  JD.decodeValue DD.seed
