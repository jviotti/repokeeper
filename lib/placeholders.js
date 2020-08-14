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

const glob = require('./glob')
const errors = require('./errors')

const WILDCARD_SYMBOL = '*'
const PLACEHOLDER_SYMBOL = '%'
const PLACEHOLDER_REGEXP = new RegExp(PLACEHOLDER_SYMBOL, 'g')

// TODO: Turn into a recursive function
module.exports = (directory, rules) => {
  return rules.reduce((accumulator, rule) => {
    const index = rule.antecedent.pattern.indexOf(PLACEHOLDER_SYMBOL)
    if (index === -1) {
      return accumulator.concat(rule)
    }

    if (rule.antecedent.negative) {
      return errors.throwParseError(
        rule.filename,
        rule.line,
        'placeholder antecedents must not be negative patterns')
    } else if (index !==
      rule.antecedent.pattern.lastIndexOf(PLACEHOLDER_SYMBOL)) {
      return errors.throwParseError(
        rule.filename,
        rule.line,
        'conditional antecedents must have a single placeholder symbol')
    }

    const results = glob(directory,
      rule.antecedent.pattern.replace(PLACEHOLDER_SYMBOL, WILDCARD_SYMBOL))
    const end =
      index + PLACEHOLDER_SYMBOL.length - rule.antecedent.pattern.length
    return accumulator.concat(results.map((result) => {
      const value = result.slice(index, end)
      return {
        antecedent: {
          pattern: rule.antecedent.pattern.replace(PLACEHOLDER_REGEXP, value),
          negative: rule.antecedent.negative
        },
        consequence: {
          pattern: rule.consequence.pattern.replace(PLACEHOLDER_REGEXP, value),
          negative: rule.consequence.negative
        },
        filename: rule.filename,
        line: rule.line
      }
    }))
  }, [])
}
