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

const path = require('path')
const glob = require('./glob')
const errors = require('./errors')

const PLACEHOLDER_SYMBOL = '%'
const PLACEHOLDER_REGEXP = new RegExp(PLACEHOLDER_SYMBOL, 'g')

exports.simplifyRules = (directory, rules) => {
  return rules.reduce((accumulator, rule) => {
    const placeholderIndex = rule.antecedent.pattern.indexOf(PLACEHOLDER_SYMBOL)

    if (placeholderIndex === -1) {
      if (rule.consequence) {
        if (rule.antecedent.negative &&
          glob(directory, rule.antecedent.pattern).length === 0) {
          accumulator.push({
            negative: rule.consequence.negative,
            pattern: rule.consequence.pattern,
            file: rule.filename,
            line: rule.line
          })
        } else if (!rule.antecedent.negative &&
          glob(directory, rule.antecedent.pattern).length > 0) {
          accumulator.push({
            negative: rule.consequence.negative,
            pattern: rule.consequence.pattern,
            file: rule.filename,
            line: rule.line
          })
        }
      } else {
        accumulator.push({
          negative: rule.antecedent.negative,
          pattern: rule.antecedent.pattern,
          file: rule.filename,
          line: rule.line
        })
      }

      return accumulator
    }

    if (rule.antecedent.pattern.indexOf(
      PLACEHOLDER_SYMBOL, placeholderIndex + 1) !== -1) {
      throw new errors.InvalidConfigurationLine(
        rule.filename,
        rule.line,
        'conditional antecedents must have a single placeholder symbol')
    }

    // Convert placeholder into a wildcard
    const antecedentFragments = rule.antecedent.pattern.split(path.posix.sep)
    const placeholderFragmentIndex = antecedentFragments.findIndex(
      (fragment) => {
        return fragment.includes(PLACEHOLDER_SYMBOL)
      })
    antecedentFragments[placeholderFragmentIndex] =
      antecedentFragments[placeholderFragmentIndex]
        .replace(PLACEHOLDER_REGEXP, '*')
    const patternLength =
      antecedentFragments[placeholderFragmentIndex + 1] === ''
        ? placeholderFragmentIndex + 2
        : placeholderFragmentIndex + 1
    const pattern = antecedentFragments.slice(0, patternLength).join(path.sep)

    // Run new pattern and replace placeholders in the conditional consequence
    const base = rule.antecedent.pattern.slice(0, placeholderIndex)
    const nextSeparatorIndex =
      rule.antecedent.pattern.indexOf(path.sep, placeholderIndex)
    const suffix = rule.antecedent.pattern.slice(
      placeholderIndex + 1,
      nextSeparatorIndex === -1
        ? rule.antecedent.pattern.length : nextSeparatorIndex + 1)

    if (rule.antecedent.negative) {
      throw new errors.InvalidConfigurationLine(
        rule.filename,
        rule.line,
        'placeholder antecedents must not be negative patterns')
    }

    for (const result of glob(directory, pattern)) {
      const value = nextSeparatorIndex === -1
        ? path.relative(base, result).slice(0, -suffix.length)
        : path.relative(base, result)

      accumulator.push({
        negative: rule.consequence.negative,
        pattern: rule.consequence.pattern.replace(PLACEHOLDER_REGEXP, value),
        file: rule.filename,
        line: rule.line
      })
    }

    return accumulator
  }, [])
}
