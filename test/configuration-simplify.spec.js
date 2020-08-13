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
const path = require('path')
const configuration = require('../lib/configuration')
const errors = require('../lib/errors')
const DIRECTORY = path.resolve(__dirname, '..')

// eslint-disable-next-line max-len
tap.test('should reject an antecedent with more than one placeholder', async (test) => {
  const ast = configuration.parseConfiguration(`
    lib/%/foo/%.js => test/%.spec.js
  `)

  test.throws(() => {
    configuration.simplifyRules(DIRECTORY, ast)
  }, errors.InvalidConfigurationLine)

  try {
    configuration.simplifyRules(DIRECTORY, ast)
  } catch (error) {
    test.is(error.lineNumber, 2)
  }

  test.end()
})
