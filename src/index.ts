/// <reference lib='esnext' />
'use strict'
import 'font-awesome/css/font-awesome.css'
import {Elm} from './Main.elm'
import {ElmMessage, TagOut, TagIn, assertNever} from './elm-message'
import {setInvalid, clearInvalid, validityFeeder} from './validation'
const app = Elm.Main.init
({flags: localStorage.getItem('session') || null})
const sendToElm = (message: ElmMessage<TagIn>): void => (app.ports.infoIn as Elm.PortToElm).send(message)

;(app.ports.infoOut as Elm.PortFromElm).subscribe
(({tag, data}: ElmMessage<TagOut>) => {
	switch (tag) {
		case TagOut.StoreSession:
			Object.assign(localStorage, {session: data})
			break
		case TagOut.ClearSession:
			localStorage.removeItem('session')
			break
		case TagOut.LogError:
			console.error('Port error:', JSON.parse(data))
			break
		case TagOut.SetInvalid:
			setInvalid(JSON.parse(data))
			break
		case TagOut.ClearInvalid:
			clearInvalid(JSON.parse(data))
			break
		default:
			assertNever(tag)
	}
}
)

validityFeeder(sendToElm)
/*
window.addEventListener
( 'storage'
, ({storageArea, key, newValue}) => {
	if ( storageArea === localStorage
		&& key === 'session'
		 ) {
    (app.ports.onSessionChange as Elm.PortToElm).send(newValue)
  }
}
)
*/
