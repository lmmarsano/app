'use strict'
export const enum TagOut
	{ StoreSession = 'StoreSession'
	, ClearSession = 'ClearSession'
	, LogError = 'LogError'
	, SetInvalid = 'SetInvalid'
	, ClearInvalid = 'ClearInvalid'
	}
export const enum TagIn
	{ Invalid = 'Invalid'
	, Valid = 'Valid'
	}
export interface ElmMessage<T> {
	tag: T
	data: string
}
export const assertNever = (tag: never): never => {
	throw new Error(`Unknown tag: ${tag}`)
}
export const elmMessage = <T>(tag: T, data: any): ElmMessage<T> =>
({ tag
 , data: JSON.stringify(data)
 })
