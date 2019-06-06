'use strict'
export type Submittable
	= HTMLButtonElement
	| HTMLInputElement
	| HTMLFieldSetElement
	| HTMLObjectElement
	| HTMLSelectElement
	| HTMLTextAreaElement
export const isSubmittable = (element: any): element is Submittable =>
	Boolean(element)
	&& [ HTMLInputElement
	   , HTMLFieldSetElement
	   , HTMLObjectElement
	   , HTMLSelectElement
	   , HTMLTextAreaElement
	   , HTMLButtonElement
	   ].some((ctor) => element instanceof ctor)
