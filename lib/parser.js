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

const CONDITIONAL_SYMBOL = '=>'
const COMMENT_SYMBOL = '#'
const NEGATIVE_SYMBOL = '!'

const decomment = (directive) => {
  if (directive.startsWith(COMMENT_SYMBOL)) {
    return ''
  }

  const commentSymbolIndex = directive.indexOf(COMMENT_SYMBOL)
  return commentSymbolIndex === -1
    ? directive
    : directive.slice(0, commentSymbolIndex)
}

const parseExpression = (expression) => {
  if (!expression) {
    return null
  }

  const text = expression.trim()
  const isNegative = text.startsWith(NEGATIVE_SYMBOL)
  return {
    pattern: isNegative ? text.slice(1) : text,
    negative: isNegative
  }
}

// TODO: Turn into a recursive function
module.exports = (filename, contents) => {
  return contents.split('\n').reduce((accumulator, line, index) => {
    const lineNumber = index + 1
    const directive = decomment(line.trim())
    if (directive.length === 0) {
      return accumulator
    }

    const expressions = directive.split(CONDITIONAL_SYMBOL)
    if (expressions.length > 2) {
      return errors.throwParseError(
        filename, lineNumber, 'no nested conditionals')
    }

    const antecedent = parseExpression(expressions[0])
    if (!antecedent) {
      return errors.throwParseError(
        filename, lineNumber, 'missing conditional antecedent')
    }

    const consequence = parseExpression(expressions[1])
    if (!consequence && expressions.length > 1) {
      return errors.throwParseError(
        filename, lineNumber, 'missing conditional consequence')
    }

    return accumulator.concat({
      line: lineNumber,
      filename,
      antecedent,
      consequence
    })
  }, [])
}
