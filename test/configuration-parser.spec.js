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

tap.test('should parse a single asterisk pattern', async (test) => {
  const result = configuration.parseConfiguration(`
    lib/*.js
  `)

  test.strictSame(result, [
    {
      line: 2,
      antecedent: 'lib/*.js',
      consequence: null
    }
  ])

  test.end()
})

tap.test('should parse a non-glob pattern', async (test) => {
  const result = configuration.parseConfiguration(`
    LICENSE
  `)

  test.strictSame(result, [
    {
      line: 2,
      antecedent: 'LICENSE',
      consequence: null
    }
  ])

  test.end()
})

tap.test('should parse two simple patterns', async (test) => {
  const result = configuration.parseConfiguration(`
    lib/*.js
    test/*.spec.js
  `)

  test.strictSame(result, [
    {
      line: 2,
      antecedent: 'lib/*.js',
      consequence: null
    },
    {
      line: 3,
      antecedent: 'test/*.spec.js',
      consequence: null
    }
  ])

  test.end()
})

tap.test('should trim patterns', async (test) => {
  const result = configuration.parseConfiguration(`
       lib/*.js
    \t\ttest/*.spec.js
  `)

  test.strictSame(result, [
    {
      line: 2,
      antecedent: 'lib/*.js',
      consequence: null
    },
    {
      line: 3,
      antecedent: 'test/*.spec.js',
      consequence: null
    }
  ])

  test.end()
})

tap.test('should ignore comments', async (test) => {
  const result = configuration.parseConfiguration(`
    # foo
    lib/*.js
    # bar
    test/*.spec.js
  `)

  test.strictSame(result, [
    {
      line: 3,
      antecedent: 'lib/*.js',
      consequence: null
    },
    {
      line: 5,
      antecedent: 'test/*.spec.js',
      consequence: null
    }
  ])

  test.end()
})

tap.test('should trim comments', async (test) => {
  const result = configuration.parseConfiguration(`
       # foo
    lib/*.js
    \t  # bar
    test/*.spec.js
  `)

  test.strictSame(result, [
    {
      line: 3,
      antecedent: 'lib/*.js',
      consequence: null
    },
    {
      line: 5,
      antecedent: 'test/*.spec.js',
      consequence: null
    }
  ])

  test.end()
})

tap.test('should ignore suffix comments', async (test) => {
  const result = configuration.parseConfiguration(`
    lib/*.js # bar
    test/*.spec.js#baz
  `)

  test.strictSame(result, [
    {
      line: 2,
      antecedent: 'lib/*.js',
      consequence: null
    },
    {
      line: 3,
      antecedent: 'test/*.spec.js',
      consequence: null
    }
  ])

  test.end()
})

tap.test('should parse a pattern with a placeholder', async (test) => {
  const result = configuration.parseConfiguration(`
    lib/%.js
  `)

  test.strictSame(result, [
    {
      line: 2,
      antecedent: 'lib/%.js',
      consequence: null
    }
  ])

  test.end()
})

tap.test('should parse a conditional pattern', async (test) => {
  const result = configuration.parseConfiguration(`
    lib/*.js => test/*.js
  `)

  test.strictSame(result, [
    {
      line: 2,
      antecedent: 'lib/*.js',
      consequence: 'test/*.js'
    }
  ])

  test.end()
})

tap.test('should trim conditional patterns', async (test) => {
  const result = configuration.parseConfiguration(`
    lib/*.js    =>    test/*.js
  `)

  test.strictSame(result, [
    {
      line: 2,
      antecedent: 'lib/*.js',
      consequence: 'test/*.js'
    }
  ])

  test.end()
})

tap.test(
  'should not allow comments before conditional symbol', async (test) => {
    const result = configuration.parseConfiguration(`
      lib/*.js # foo => test/*.js
    `)

    test.strictSame(result, [
      {
        line: 2,
        antecedent: 'lib/*.js',
        consequence: null
      }
    ])

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

tap.test('should throw with the right line numbers', async (test) => {
  const contents = [
    'lib/*.js',
    '',
    '=> test/*.js'
  ].join('\n')

  test.throws(() => {
    configuration.parseConfiguration(contents)
  }, errors.InvalidConfigurationLine)

  try {
    configuration.parseConfiguration(contents)
  } catch (error) {
    test.is(error.lineNumber, 3)
  }

  test.end()
})
