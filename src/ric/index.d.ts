/// <reference lib='dom' />
declare interface Window {
	requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number
	cancelIdleCallback(handle: number): void
}

interface IdleRequestOptions {
  timeout: number
}

interface IdleRequestCallback {
	(deadline: IdleDeadline): void
}

interface IdleDeadline {
  timeRemaining: () => number
  readonly didTimeout: boolean
}

declare function requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number

declare function cancelIdleCallback(handle: number): void
