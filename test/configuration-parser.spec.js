/*
 * Copyright 2020 Juan Cruz Viotti
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const tap = require('tap')
const configuration = require('../lib/configuration')
const errors = require('../lib/errors')

tap.test('should parse no configuration', async (test) => {
  const result = configuration.parseConfiguration('')
  test.strictSame(result, [])
  test.end()
})

tap.test('should reject conditionals without an antecedent', async (test) => {
  const contents = [
    '=> test/*.js'
  ].join('\n')

  test.throws(() => {
    configuration.parseConfiguration(contents)
  }, errors.InvalidConfigurationLine)

  try {
    configuration.parseConfiguration(contents)
  } catch (error) {
    test.is(error.lineNumber, 1)
  }

  test.end()
})

tap.test('should reject conditionals without a consequence', async (test) => {
  const contents = [
    'test/*.js =>'
  ].join('\n')

  test.throws(() => {
    configuration.parseConfiguration(contents)
  }, errors.InvalidConfigurationLine)

  try {
    configuration.parseConfiguration(contents)
  } catch (error) {
    test.is(error.lineNumber, 1)
  }

  test.end()
})
