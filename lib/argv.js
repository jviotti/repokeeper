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

const minimist = require('minimist')
const packageJSON = require('../package.json')

exports.parse = (args) => {
  const argv = minimist(args)
  return {
    config: argv.configuration || argv.c,
    printRules: Boolean(argv['print-rules'] || argv.p),
    version: Boolean(argv.version || argv.v),
    help: Boolean(argv.help || argv.h),
    directory: argv.directory || argv.d || process.cwd()
  }
}

exports.help = `Usage: ${packageJSON.name} [options]

Options
    -v, --version                print version and exit
    -h, --help                   print help and exit
    -p, --print-rules            print rules and exit
                                 for debugging purposes
    -d, --directory <directory>  set project directory
                                 defaults to current directory
    -c, --configuration <file>   set configuration file

Example
    ${packageJSON.name} -d my/project -c .repokeeperrc
`
