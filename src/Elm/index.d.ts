/// <reference lib='dom' />
// Type definitions for Elm 0.19
// Project: http://elm-lang.org
// Definitions by: Dénes Harmath <https://github.com/thSoft>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare const Elm: Elm

declare interface Elm {
	[index: string]: Elm.Init
}

declare namespace Elm {
	interface Init {
		init<T>(modifiers?: {node?: Node, flags?: T}): Ports
	}

	interface Ports {
		ports: PortMap
	}

	interface PortMap {
		[index: string]: PortToElm | PortFromElm
	}

	interface PortToElm {
		send<V>(value: V): void
	}

	interface PortFromElm {
		subscribe<V>(handler: (value: V) => void): void
		unsubscribe<V>(handler: (value: V) => void): void
	}
}
