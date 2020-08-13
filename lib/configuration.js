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

const CONDITIONAL_SEPARATOR = '=>'
const COMMENT_SYMBOL = '#'
const PLACEHOLDER_SYMBOL = '%'
const PLACEHOLDER_REGEXP = new RegExp(PLACEHOLDER_SYMBOL, 'g')

exports.parseConfiguration = (contents) => {
  return contents.split('\n').map((string, index) => {
    const commentStartIndex = string.indexOf(COMMENT_SYMBOL)
    return {
      string: commentStartIndex === -1
        ? string : string.slice(0, commentStartIndex),
      number: index + 1
    }
  }).filter((line) => {
    return line.string.trim().length > 0
  }).reduce((accumulator, line) => {
    const [ antecedent, consequence ] = line.string.split(CONDITIONAL_SEPARATOR)
      .map((fragment) => {
        return fragment.trim()
      })

    if (antecedent.length === 0) {
      throw new errors.InvalidConfigurationLine(
        line.number, 'missing conditional antecedent')
    } else if (
      line.string.indexOf(CONDITIONAL_SEPARATOR) !== -1 && !consequence) {
      throw new errors.InvalidConfigurationLine(
        line.number, 'missing conditional consequence')
    }

    accumulator.push({
      line: line.number,
      antecedent,
      consequence: consequence || null
    })

    return accumulator
  }, [])
}

exports.simplifyRules = (directory, rules) => {
  return rules.reduce((accumulator, rule) => {
    const placeholderIndex = rule.antecedent.indexOf(PLACEHOLDER_SYMBOL)

    if (placeholderIndex !== -1) {
      if (rule.antecedent.indexOf(
        PLACEHOLDER_SYMBOL, placeholderIndex + 1) !== -1) {
        throw new errors.InvalidConfigurationLine(
          rule.line,
          'conditional antecedents must have a single placeholder symbol')
      }

      // Convert placeholder into a wildcard
      const antecedentFragments = rule.antecedent.split(path.posix.sep)
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
      const base = rule.antecedent.slice(0, placeholderIndex)
      const nextSeparatorIndex =
        rule.antecedent.indexOf(path.sep, placeholderIndex)
      const suffix = rule.antecedent.slice(
        placeholderIndex + 1,
        nextSeparatorIndex === -1
          ? rule.antecedent.length : nextSeparatorIndex + 1)
      for (const result of glob(directory, pattern)) {
        const value = nextSeparatorIndex === -1
          ? path.relative(base, result).slice(0, -suffix.length)
          : path.relative(base, result)

        accumulator.push({
          pattern: rule.consequence.replace(PLACEHOLDER_REGEXP, value),
          line: rule.line
        })
      }
    } else if (rule.consequence) {
      if (glob(directory, rule.antecedent).length > 0) {
        accumulator.push({
          pattern: rule.consequence,
          line: rule.line
        })
      }
    } else {
      accumulator.push({
        pattern: rule.antecedent,
        line: rule.line
      })
    }

    return accumulator
  }, [])
}
