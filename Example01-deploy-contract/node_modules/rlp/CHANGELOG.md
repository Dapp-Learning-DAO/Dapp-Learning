# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
(modification: no type change headlines) and this project adheres to
[Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [v2.2.6] - 2020-07-17

- Fixed a few edge-cases in decoding long strings that previously could cause
  OOM (Out of Memory) crash,
  PR [#91](https://github.com/ethereumjs/rlp/pull/91)
- Updated GitHub `actions/checkout` to v2,
  PR [#92](https://github.com/ethereumjs/rlp/pull/92)

[v2.2.6]: https://github.com/ethereumjs/rlp/compare/2.2.5...v2.2.6

## [v2.2.5] - 2020-05-25

- Added `BigInt` as an accepted encoding type,
  PR [#85](https://github.com/ethereumjs/rlp/pull/85)
- Added support/testing for Node 10, 12, 13, 14, moved from Travis to GitHub Actions,
  PR [#87](https://github.com/ethereumjs/rlp/pull/87)
- Formatting and config cleanups,
  PRs [#86](https://github.com/ethereumjs/rlp/pull/86) and
  [#88](https://github.com/ethereumjs/rlp/pull/88)

[v2.2.5]: https://github.com/ethereumjs/rlp/compare/2.2.4...v2.2.5

## [v2.2.4] - 2019-11-02

- Removed unused `Dictionary` `Input` type for `RLP.encode()` and `RLP.decode()`,
  PR [#74](https://github.com/ethereumjs/rlp/pull/74)
- Removed unused `safe-buffer` dependency,
  PR [#80](https://github.com/ethereumjs/rlp/pull/80)

[v2.2.4]: https://github.com/ethereumjs/rlp/compare/2.2.3...v2.2.4

## [v2.2.3] - 2019-03-19

- More robust `Array` type checking in `RLP.encode()` function,
  PR [#70](https://github.com/ethereumjs/rlp/pull/70)
- Library now throws an error when trying to encode negative integer
  values (e.g. `RLP.encode(-1)`),
  PR [#71](https://github.com/ethereumjs/rlp/pull/70)

[v2.2.3]: https://github.com/ethereumjs/rlp/compare/2.2.2...v2.2.3

## [v2.2.2] - 2019-01-15

- Added `bn.js` dependency to fix module resolution bug when require the module after
  clean install, PR [#64](https://github.com/ethereumjs/rlp/pull/64)
- Use local version of official tests, fixed testing issue, PR [#66](https://github.com/ethereumjs/rlp/pull/66)

[v2.2.2]: https://github.com/ethereumjs/rlp/compare/2.2.1...v2.2.2

## [v2.2.1] - 2018-12-20

- Fixed a bug introduced in `v2.2.0` causing the CLI `bin/rlp` command not to
  work, see PR [#60](https://github.com/ethereumjs/rlp/pull/60)
- Additional exports of types used by `decode` and `encode`
  (PR [#59](https://github.com/ethereumjs/rlp/pull/59)):
  - `Input`: input type for `encode()`
  - `Dictionary` and `List`: interfaces for possible `Input` values
  - `Decoded`: interface for `decode()` return type
- Additional test structure and new integration tests for distribution and
  `bin/rlp` CLI command, see PR [#57](https://github.com/ethereumjs/rlp/pull/57)

[v2.2.1]: https://github.com/ethereumjs/rlp/compare/2.2.0...v2.2.1

## [v2.2.0] - 2018-12-17

[DEPRECATED] Please update to `v2.2.1`, release contains a broken CLI `bin/rlp`
command!

First `TypeScript` based release of `EthereumJS` libraries, thanks @krzkaczor,
@GrandSchtroumpf, @whymarrh, @holgerd77 for the great work on this!

This release doesn't introduce any main new features but will serve as a basis
for further `TypeScript` transitions coming along with greater type safety
for `EthereumJS` libraries. If you are developing in `TypeScript` you can
further already benefit from the `RLP` type declarations published from now on
along new releases.

See PR [#37](https://github.com/ethereumjs/rlp/pull/37) and subsequent PRs merged
towards the associated `typescript` branch to get an overview on the changes.
The release also comes along with the introduction of a new repo
[ethereumjs-config](https://github.com/ethereumjs/ethereumjs-config) centralizing
configuration for `EthereumJS` libraries on `TypeScript` itself as well as
linting, formatting and testing.

This release passes all existing unit tests and other checks. If you nevertheless
experience problems please report on the `EthereumJS`
[Gitter](https://gitter.im/ethereum/ethereumjs) channel.

Other changes:

- Added `LICENSE` file for `MPL2.0`, see PR [#31](https://github.com/ethereumjs/rlp/pull/31)

[v2.2.0]: https://github.com/ethereumjs/rlp/compare/2.1.0...v2.2.0

## [v2.1.0] - 2018-06-28

- Updated supported Node versions, PR [#13](https://github.com/ethereumjs/rlp/pull/13)
- Switched to `safe-buffer` for backwards compatibility, PR [#18](https://github.com/ethereumjs/rlp/pull/18)
- Increased test coverage, PR [#22](https://github.com/ethereumjs/rlp/pull/22)
- Example code tweaks, PR [#12](https://github.com/ethereumjs/rlp/pull/12)
- Fix test runs on Windows, Issue [#7](https://github.com/ethereumjs/rlp/issues/7)
- Added code coverage, PR [#8](https://github.com/ethereumjs/rlp/pull/8)

[v2.1.0]: https://github.com/ethereumjs/rlp/compare/2.0.0...v2.1.0

## [2.0.0] - 2015-09-23

- User `Buffer` values as input for encoding

[2.0.0]: https://github.com/ethereumjs/rlp/compare/1.1.2...2.0.0

## [1.1.2] - 2015-09-22

- Fix zero encoding

[1.1.2]: https://github.com/ethereumjs/rlp/compare/1.1.1...1.1.2

## [1.1.1] - 2015-09-21

- Fixes for `bin`

[1.1.1]: https://github.com/ethereumjs/rlp/compare/1.1.0...1.1.1

## [1.1.0] - 2015-09-21

- Added `getLength()` method
- Added hex prefix stripping (`isHexPrefix()` / `stripHexPrefix()`)
- Code formatting clean-ups

[1.1.0]: https://github.com/ethereumjs/rlp/compare/1.0.1...1.1.0

## [1.0.1] - 2015-06-27

- Code formatting clean-ups

[1.0.1]: https://github.com/ethereumjs/rlp/compare/1.0.0...1.0.1

## [1.0.0] - 2015-06-06

- Added check for invalid 0
- Hardened rlp

[1.0.0]: https://github.com/ethereumjs/rlp/compare/0.0.14...1.0.0

## Older releases:

- [0.0.14](https://github.com/ethereumjs/rlp/compare/0.0.13...0.0.14) - 2015-03-31
- [0.0.13](https://github.com/ethereumjs/rlp/compare/0.0.12...0.0.13) - 2015-03-30
- [0.0.12](https://github.com/ethereumjs/rlp/compare/0.0.11...0.0.12) - 2014-12-26
