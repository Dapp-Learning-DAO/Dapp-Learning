# available-typed-arrays <sup>[![Version Badge][2]][1]</sup>

[![Build Status][3]][4]
[![dependency status][5]][6]
[![dev dependency status][7]][8]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][11]][1]

Returns an array of Typed Array names that are available in the current environment.

## Example

```js
var availableTypedArrays = require('available-typed-arrays');
var assert = require('assert');

assert.deepStrictEqual(availableTypedArrays(), [
	'Int8Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Int16Array',
	'Uint16Array',
	'Int32Array',
	'Uint32Array',
	'Float32Array',
	'Float64Array',
	'BigInt64Array',
	'BigUint64Array'
].sort());
```

## Tests
Simply clone the repo, `npm install`, and run `npm test`

[1]: https://npmjs.org/package/available-typed-arrays
[2]: http://versionbadg.es/inspect-js/available-typed-arrays.svg
[3]: https://travis-ci.org/inspect-js/available-typed-arrays.svg
[4]: https://travis-ci.org/inspect-js/available-typed-arrays
[5]: https://david-dm.org/inspect-js/available-typed-arrays.svg
[6]: https://david-dm.org/inspect-js/available-typed-arrays
[7]: https://david-dm.org/inspect-js/available-typed-arrays/dev-status.svg
[8]: https://david-dm.org/inspect-js/available-typed-arrays#info=devDependencies
[11]: https://nodei.co/npm/available-typed-arrays.png?downloads=true&stars=true
[license-image]: http://img.shields.io/npm/l/available-typed-arrays.svg
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/available-typed-arrays.svg
[downloads-url]: http://npm-stat.com/charts.html?package=available-typed-arrays
