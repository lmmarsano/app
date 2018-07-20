'use strict'
import test from 'ava'
import {title} from '../test-macro'
import {relativeUrl} from '../utility'

const relativeUrlTest = (t, expected, from, to) => t.is(relativeUrl(from, to), expected)
relativeUrlTest.title = (caption, expected, ...args) => title(caption, expected, relativeUrl, ...args)

test(relativeUrlTest, '.', '', '')
test(relativeUrlTest, 'a/a', 'a', 'a')
test(relativeUrlTest, 'a', 'a/', 'a')
