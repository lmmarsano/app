'use strict'
import test from 'ava'
import {title} from '../test-macro'
import {prune} from '../utility'

const pruneTest = (t, expected, ...args) => t.is(prune(...args), expected)
    , pruneTestDeep = (t, expected, ...args) => t.deepEqual(prune(...args), expected)
    , pruneIdentity = (t, expected) => pruneTest(t, expected, expected)
    , pruneIdentityDeep = (t, expected) => pruneTestDeep(t, expected, expected)
pruneTest.title = pruneTestDeep.title
                = (caption, expected, ...args) => title(caption, expected, prune, ...args)
pruneIdentity.title = pruneIdentityDeep.title
                    = (title, expected) => pruneTest.title(title, expected, expected)

test(pruneIdentity, undefined)
test(pruneIdentity, null)
test(pruneIdentity, false)
test(pruneIdentity, 0)
test(pruneIdentity, '')
test(pruneIdentity, /./)
test(pruneIdentity, [])
test(pruneIdentity, () => {})
test(pruneIdentityDeep, {key: 0})
test(pruneTest, undefined, {})
test(pruneTest, undefined, {key: undefined})
test(pruneTest, undefined, {key: {}})
test(pruneTestDeep, {key: 0}, {key: 0, drop: undefined})
test(pruneTestDeep, {key: 0}, {key: 0, drop: {}})
test(pruneTestDeep, {key: 0, obj: {key: 0}}, {key: 0, obj: {key: 0, drop: undefined}})
