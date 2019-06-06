module Page exposing (Page(..), model, update, view, subscriptions)

import Utility exposing (noCmd)
import Port as P
import Msg as M
import Page.Register as PR
import Page.Register.Msg as PRM
import Page.LogIn as PL
import Error exposing (Error(..))
import Route exposing (Path)
import Data.Type exposing (Session)
import Msg exposing (Msg(..))
import Json.Decode as JD
import Json.Encode as JE
import Browser exposing (Document)
import Html

type Page
  = Pending
  | Root
    -- | NotFound
  | Error Error
    -- | Home Home.Model
    -- | Settings Settings.Model
  | LogIn PL.Model
  | Register PR.Model

-- | Profile Username Profile.Model
-- | Editor (Maybe Slug) Editor.Model

model : Path -> Session -> Page
model path session =
  let _ = Debug.log (String.join " "
                       [ "Page.model"
                       , Debug.toString path
                       , Debug.toString session
                       ]) ()
  in case session of
    Nothing ->
      case path of
        Route.Root ->
          Root

        Route.Register ->
          Register PR.init

        Route.LogIn ->
          LogIn PL.init

        _ ->
          Error Error.NotAuthorized

    Just user ->
      case path of
        Route.Root ->
          Root

        {-
           Route.EditUser ->
             ()

           Route.EditContainer id ->
             ()

           Route.EditResource id ->
             ()
        -}
        _ ->
          Error Error.LoggedIn

update msg page =
  case (msg, page) of
    (M.Register registerMsg, Register registerModel) ->
      PR.update registerMsg registerModel
        |> Tuple.mapFirst Register

    (M.LogIn logInMsg, LogIn logInModel) ->
      PL.update logInMsg logInModel
        |> Tuple.mapFirst LogIn

    _ ->
      Debug.log (String.join " "
                   [ "Page.update unhandled case"
                   , Debug.toString (msg, page)
                   ]
                )
        <| noCmd page

view : Session -> Page -> Document Msg
view session page =
  case page of
    LogIn logInModel ->
      PL.view logInModel

    Register registerModel ->
      PR.view registerModel

    Root ->
      { title = ""
      , body = []
      }

    _ ->
      Debug.log (String.join " "
                   [ "Page.view unhandled case"
                   , Debug.toString page
                   ]
                )
        { title = "Pending"
        , body = []
        }

subscriptions: Page -> Sub M.Msg
subscriptions page
  = case page of
      Register _ ->
        P.input (PRM.InfoIn >> M.Register) M.PortError

      _ ->
        Sub.none
