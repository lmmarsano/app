/// <reference lib='esnext' />
/// <reference path='declaration.d.ts' />
/// <reference path='ric/index.d.ts' />
'use strict'
import {Elm} from './Main.elm'
import {ElmMessage, TagIn, elmMessage} from './elm-message'
import {Submittable, isSubmittable} from './submittable'
// import hyperform from 'hyperform'
// const wrapper = hyperform(window)
const debouncer
	= <T extends {}>( requestCallback: (callback: (deadline: T) => void) => number
									, cancelCallback: (handle: number) => void
									) => (func: (deadline: T) => boolean): () => void => {
		let token: number | null = null
		const later = (deadline: T) => {
			token
				= func(deadline)
				? requestCallback(later)
				: null
		}
		const debouncedFunc = () => {
			token || (token = requestCallback(later))
		}
		return debouncedFunc
	}
, debounceIdle = debouncer(requestIdleCallback, cancelIdleCallback)
, debounceAF = debouncer(requestAnimationFrame, cancelAnimationFrame)
, {setInvalid, clearInvalid} = (() => {
	const customMessages: {[index: string]: string} = {}
	/*const pending: Set<Submittable> = new Set
	const animate = debounceAF((time) => {
		for (const element: Submittable of pending) {
			element.reportValidity()
			pending.delete(element)
		}
	})*/
	const update = debounceIdle((deadline) => {
		for (const key of Object.keys(customMessages)) {
			if (deadline.timeRemaining()) {
				const element = document.getElementById(key)
				if (isSubmittable(element)) {
					element.setCustomValidity(JSON.parse(customMessages[key]))
				}
				delete customMessages[key]
				// pending.add(element)
			} else {
				// animate()
				return true
			}
		}
		// animate()
		return false
	})
	return {
		setInvalid: ({id, error}: {id: string, error: string}): void => {
			customMessages[id] = error
			update()
		}
		, clearInvalid: (id: string): void => {
			customMessages[id] = ''
			update()
		}
	}
})()
, validityFeeder = (send: (message: ElmMessage<TagIn>) => void): void => {
	{
		const onValid: EventListener = (event) => {
			send(elmMessage(TagIn.Valid, (<Submittable>event.target).id))
		}
		window.addEventListener('valid', onValid)
	}
	{
		const onInvalid: EventListener = (event) => {
			const {target} = event
			if (isSubmittable(target)) {
				const {id} = target
				send(elmMessage
						 ( TagIn.Invalid
				     , { id
				       , error: target.validationMessage
							 }
						 )
						)
			}
		}
		window.addEventListener('invalid', onInvalid)
	}
}
export {setInvalid, clearInvalid, validityFeeder}
