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

const errors = require('./errors')

process.on('uncaughtException', (error) => {
  if (error.code === 'ENOENT') {
    console.error(`ERROR: configuration file does not exist: ${error.path}`)
  } else if (error instanceof errors.InvalidConfigurationLine) {
    console.error(`ERROR: line ${error.lineNumber}:`, error.message)
  } else {
    console.error(error)
  }

  process.exit(1)
})

const fs = require('fs')
const path = require('path')
const tabula = require('tabula')
const difference = require('lodash.difference')
const argv = require('minimist')(process.argv.slice(2))

const glob = require('./glob')
const configuration = require('./configuration')
const filesystem = require('./filesystem')
const packageJSON = require('../package.json')

const ARGV_CONFIG = argv.configuration || argv.c
const ARGV_PRINT_RULES = Boolean(argv['print-rules'] || argv.p)
const ARGV_VERSION = Boolean(argv.version || argv.v)
const ARGV_HELP = Boolean(argv.help || argv.h)
const ARGV_DIRECTORY = argv.directory || argv.d || process.cwd()

const printHelp = () => {
  console.error(`Usage: ${packageJSON.name} [options]\n`)
  console.error('Options')
  console.error('    -v, --version                print version and exit')
  console.error('    -h, --help                   print help and exit')
  console.error('    -p, --print-rules            print rules and exit')
  console.error('                                 for debugging purposes')
  console.error('    -d, --directory <directory>  set project directory')
  // eslint-disable-next-line max-len
  console.error('                                 defaults to current directory')
  console.error('    -c, --configuration <file>   set configuration file')
  console.error('\nExample')
  console.error(`    ${packageJSON.name} -d my/project -c .repokeeperrc`)
}

if (ARGV_VERSION) {
  console.log(packageJSON.name, packageJSON.version)
  process.exit(0)
}

if (ARGV_HELP) {
  printHelp()
  process.exit(0)
}

if (!ARGV_CONFIG) {
  if (Object.keys(argv).length > 1) {
    console.error('ERROR: missing configuration option')
  } else {
    printHelp()
  }

  process.exit(1)
}

const RULES = fs.readFileSync(ARGV_CONFIG, 'utf8')
console.error(`using configuration file: ${ARGV_CONFIG}`)

const PARSED_RULES =
  configuration.simplifyRules(
    ARGV_DIRECTORY, configuration.parseConfiguration(ARGV_CONFIG, RULES))

if (ARGV_PRINT_RULES) {
  console.error('printing detected rules...')
  tabula(PARSED_RULES.map((rule) => {
    rule.line = `(${rule.file}:${rule.line})`

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
const ALL_FILES = filesystem.recursiveReaddir(ARGV_DIRECTORY).map((file) => {
  return path.relative(ARGV_DIRECTORY, file)
})

const negatives = []

console.error('checking file and directory rules...')
const MATCHED_FILES = PARSED_RULES.reduce((accumulator, rule) => {
  const results = glob(ARGV_DIRECTORY, rule.pattern)

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
