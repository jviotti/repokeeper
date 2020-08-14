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

const glob = require('../glob')

// TODO: Turn into a recursive function
module.exports = (directory, rules) => {
  return rules.reduce((accumulator, rule) => {
    if (!rule.consequence) {
      return accumulator.concat({
        negative: rule.antecedent.negative,
        pattern: rule.antecedent.pattern,
        filename: rule.filename,
        line: rule.line
      })
    }

    const results = glob(directory, rule.antecedent.pattern)
    if ((rule.antecedent.negative && results.length === 0) ||
      (!rule.antecedent.negative && results.length > 0)) {
      return accumulator.concat({
        negative: rule.consequence.negative,
        pattern: rule.consequence.pattern,
        filename: rule.filename,
        line: rule.line
      })
    }

    return accumulator
  }, [])
}
