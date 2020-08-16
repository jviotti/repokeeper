repokeeper
==========

`repokeeper` is a programming language-independent command-line tool to lint
file and directory structure using a declarative definition inspired by
[`.gitignore`](https://git-scm.com/docs/gitignore).

Philosophy
----------

It is widely accepted that developers spend more time reading than writing code
[^1][^2]. For this reason, established projects typically have a predictable
file and directory structure to help developers browse and read code. For
example, test files may be located in a directory called `test` and include a
`.spec` suffix, while Markdown documentation may be located in subdirectories
inside a directory called `docs/`. More often than not, these file and
directory conventions are not automatically enforced, which can become
problematic on projects involving many collaborators:

- **Code review burden**: Maintainers spend more time during the code review
  process to ensure the file structure is preserved
- **No source of truth**: People have slightly different perceptions of what
  the conventions are
- **Human process**: Some violations to the file and directory structure may go
  undetected, given that enforcing the conventions is a human process
- **Scare newcomers**: Newcomers may not understand what the implicit
  conventions are, and make mistakes that add more friction to their first
  contributions

*The file and directory structure of a project is an interface to its
developers*, and it should be treated as such.

Installation
------------

You can install `repokeeper` through `npm`:

```
npm install -g repokeeper
```

Example
-------

Check out the
[`.repokeeperrc`](https://github.com/jviotti/repokeeper/blob/master/.repokeeperrc)
configuration file that `repokeeper` itself uses, which includes tons of
explanatory comments.

You can run `repokeeper` on `repokeeper` by executing the following commands:

```sh
git clone https://github.com/jviotti/repokeeper
cd repokeeper
npm install -g .
repokeeper --configuration .repokeeperrc
```

Configuration
-------------

The command-line tool takes a configuration file that defines the desired file
and directory structure through a whitelisting approach. The configuration file
resembles [`.gitignore`](https://git-scm.com/docs/gitignore). Each non-empty
line is either a comment (starting with `#`) or a rule that represents a set of
files that are considered valid. For example:

```
lib/**/*.js
.*
*.md
LICENSE
package*.json
```

Rules have the following form:

- `PATTERN`: A simple rule. Any project file that matches `PATTERN` is
  considered *valid*. For example: `lib/*.js`, `lib/**/*.js`, `.*`
- `!PATTERN`: A negative rule. Any project file that matches `!PATTERN`
  is considered *invalid*. For example: `!lib/*.ts`, `!*.o`
- `PATTERN_A => PATTERN_B`: A conditional rule. If the project has any
  files matching `PATTERN_A`, then any project file that matches `PATTERN_B` is
  considered valid. For example: `lib/*.js => test/*.js`

Conditional rules support the `%` placeholder symbol. If a conditional rule
antecedent contains the `%` symbol, then any occurence of the `%` symbol in the
conditional consequence is replaced by the value of `%` when executing the
antecedent expression. For example, consider the following rule:

```
lib/%.js => test/%.spec.js
```

If the project includes `lib/foo.js` and `lib/bar.js`, then the above rule is
expanded as:

```
lib/foo.js => test/foo.spec.js
lib/bar.js => test/bar.spec.js
```

Placeholders are useful to create mirrored directories.

Future work
-----------

- Make `repokeeper` automatically read `.gitignore` and take its patterns into
  consideration
- Support custom invalid file error messages defined in the configuration file,
  next to each rule
- Add support for cardinality operators. For example, only allow up to X files
  that match a certain pattern
- Add support for defining the file and directory name case. For example, camel
  case, snake case, etc

Do you have any suggestions? Please [open an
issue](https://github.com/jviotti/repokeeper/issues/new) on GitHub.

Tests
-----

The test suite consists of a set of `repokeeper` configuration files and
`repokeeper` command invokation against the `repokeeper` project itself. The
tests pass if the result of executing the command (`stderr`, `stdout`, and exit
code) matches the expectations defined by the test cases.

Run the test suite by executing the following command:

```sh
npm test
```

License
-------

The project is licensed under the [Apache
2.0](https://github.com/jviotti/repokeeper/blob/master/LICENSE) license.

[^1]: https://www.goodreads.com/quotes/835238-indeed-the-ratio-of-time-spent-reading-versus-writing-is
[^2]: https://blog.pragmaticengineer.com/readable-code/
