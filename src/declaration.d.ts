/// <reference lib='dom' />
declare module 'hyperform' {
	const hyperform: Hyperform
	export default hyperform

	type Submittable
		= HTMLButtonElement
		| HTMLInputElement
		| HTMLFieldSetElement
		| HTMLObjectElement
		| HTMLSelectElement
		| HTMLTextAreaElement

	type Validator = Exclude<keyof ValidityState, 'customError' | 'valid'>

	interface Hyperform {
		( element: Window | HTMLFormElement | Submittable
		, options?:
		  { classes: Record<Hyperform.Classes, string>
			, extendFieldset: boolean
			, novalidateOnElements: boolean
			, preventImplicitSubmit: boolean
			, revalidate: Hyperform.Revalidate
			, strict: boolean
			, validEvent: boolean
			, validateNameless: boolean
		  }
		): Hyperform.Wrapper
		addTranslation(language: string, map: Hyperform.Catalog): void
		addValidator(element: Submittable, callback: (element: Submittable) => boolean): void
		setLanguage(language: string): void
		setMessage(element: Submittable, validator: Validator, message: string): void
	}

	namespace Hyperform {
		const enum Revalidate
		{ oninput = 'oninput'
		, onblur = 'onblur'
		, hybrid = 'hybrid'
		, onsubmit = 'onsubmit'
		, never = 'never'
		}
		const enum Classes
		{ warning = 'warning'
		, valid = 'valid'
		, invalid = 'invalid'
		, validated = 'validated'
		}
		interface Wrapper {
			destroy(): void
		}
		interface Catalog {
			TextTooLong: string
			ValueMissing: string
			CheckboxMissing: string
			RadioMissing: string
			FileMissing: string
			SelectMissing: string
			InvalidEmail: string
			InvalidURL: string
			PatternMismatch: string
			PatternMismatchWithTitle: string
			NumberRangeOverflow: string
			DateRangeOverflow: string
			TimeRangeOverflow: string
			NumberRangeUnderflow: string
			DateRangeUnderflow: string
			TimeRangeUnderflow: string
			StepMismatch: string
			StepMismatchOneValue: string
			BadInputNumber: string
		}
	}
}
