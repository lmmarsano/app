'use strict'
import test from 'ava'
import {normalizeUrl} from '../utility'
import {title} from '../test-macro'
const nUTest = (t, expect, url) => t.is(normalizeUrl(url), expect)
nUTest.title = (caption, expect, url) => title(caption, expect, normalizeUrl, url)

test(nUTest, '/', '')
test(nUTest, '/', '.')
test(nUTest, '/', '..')
test(nUTest, '/', '/')
test(nUTest, '/a', '/a')
test(nUTest, '/a', '/a/')
test(nUTest, '/a', 'a')
test(nUTest, '/a', 'a/')
test(nUTest, '/a', 'a//')
test(nUTest, '/a', 'a/.')
test(nUTest, '/a', 'a/./')
test(nUTest, '/', 'a/..')
test(nUTest, '/', 'a/../')
test(nUTest, '/b', 'a/../b')
test(nUTest, '/a/b', 'a//b')
test(nUTest, '/a/b', 'a/./b')
