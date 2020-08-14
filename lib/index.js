#!/usr/bin/env node
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

process.on('uncaughtException', (error) => {
  if (error.code === 'ENOENT') {
    console.error(`ERROR: configuration file does not exist: ${error.path}`)
  } else if (error.code === 'INVALID_CONFIGURATION') {
    console.error(`ERROR: (${error.filename}:${error.line}):`, error.message)
  } else {
    console.error(error)
  }

  process.exit(1)
})

const fs = require('fs')
const tabula = require('tabula')
const difference = require('lodash.difference')

const conditionals = require('./pipeline/conditionals')
const parser = require('./pipeline/parser')
const placeholders = require('./pipeline/placeholders')

const argv = require('./argv')
const filesystem = require('./filesystem')
const glob = require('./glob')

const packageJSON = require('../package.json')
const options = argv.parse(process.argv.slice(2))

if (options.version) {
  console.log(packageJSON.name, packageJSON.version)
  process.exit(0)
}

if (options.help) {
  argv.help()
  process.exit(0)
}

if (!options.config) {
  console.error('ERROR: missing configuration option')
  process.exit(1)
}

const RULES = fs.readFileSync(options.config, 'utf8')
console.error(`using configuration file: ${options.config}`)

const PARSED_RULES =
  conditionals(options.directory,
    placeholders(options.directory, parser(options.config, RULES)))

if (options.printRules) {
  console.error('printing detected rules...')
  tabula(PARSED_RULES.map((rule) => {
    rule.line = `(${rule.filename}:${rule.line})`

    if (rule.negative) {
      rule.pattern = `!${rule.pattern}`
    }

    return rule
  }), {
    columns: [ 'line', 'pattern' ],
    skipHeader: true
  })

  process.exit(0)
}

console.error('traversing directory structure...')
const ALL_FILES = filesystem.walk(options.directory, (file) => {
  return !file.startsWith('.git')
})

const negatives = []

console.error('checking file and directory rules...')
const MATCHED_FILES = PARSED_RULES.reduce((accumulator, rule) => {
  const results = glob(options.directory, rule.pattern)

  if (rule.negative) {
    negatives.push(...results)
    return accumulator
  }

  accumulator.push(...results)
  return accumulator
}, [])

const DIFFERENCE = difference(ALL_FILES, MATCHED_FILES)
if (DIFFERENCE.length === 0 && negatives.length === 0) {
  console.error('repository looks good')
  process.exit(0)
}

console.log('\nERROR: the following files must not exist:\n')
console.log(DIFFERENCE.concat(negatives).join('\n'))
process.exit(1)
