'use strict'
const {PassThrough} = require('stream')
    , hidden = Symbol('hidden')

class MultiWriterError extends Error {
	constructor(error, destination) {
		super('Destination emitted an error.')
		Object.assign(this, {error, destination})
	}
}

class MultiWriterHooks {
	constructor(instance) {
		this.hookMap = { error(e) {
			instance.emit('error', new MultiWriterError(e, this))
			instance.pipe(this)
		}
		               }
	}
	hookIterate(stream, method) {
		const hookMap = this.hookMap
		for (const hook in hookMap) {
			stream[method](hook, hookMap[hook])
		}
	}
}

class MultiWriter extends PassThrough {
	constructor(destination, options) {
		super()
		this.once('end', () => this.destinations.forEach((stream) => this.unpipe(stream)))
		this.destinations = new Set
		this[hidden] = new MultiWriterHooks(this)
		this.add(...arguments)
	}
	add(destination, options) {
		if (Symbol.iterator in destination) {
			for (const element of destination) {
				this.add(element, options)
			}
			return this
		}
		this.pipe(...arguments)
		return this
	}
	selfDestruct() {
		this.destinations.forEach((destination) => this.unpipe(destination))
		this.destroy(...arguments)
		return this
	}
	pipe(destination, options) {
		this.destinations.add(destination)
		this[hidden].hookIterate(destination, 'on')
		super.pipe(...arguments)
		return this
	}
	unpipe(destination) {
		super.unpipe(...arguments)
		// error events unpipe: let events process before removing hooks
		process.nextTick(() => this[hidden].hookIterate(destination, 'off'))
		this.destinations.delete(destination)
		return this
	}
}

module.exports = MultiWriter
