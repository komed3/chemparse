# ChemParse

**ChemParse** is a lightweight TypeScript library for parsing and comparing chemical formulas.

It supports all 118 IUPAC element symbols, nested groups, decimal and scientific notation,
hydrate notation, leading coefficients, element lists, and ionic charges.


## Features

- Parses chemical formulas into element counts
- Supports all 118 IUPAC element symbols
- Handles nested parentheses, square brackets, and curly brackets
- Supports decimal and scientific notation
- Parses dot-separated and underscore-separated hydrate parts
- Supports leading coefficients and hydrate multipliers
- Accepts comma-separated element lists inside groups
- Recognizes ionic charges in caret and Unicode superscript notation
- Compares multiple formulas by composition and charge
- Calculates element count and charge differences
- Provides TypeScript types and both named and default exports
- Uses an iterative parser to handle nested groups


## Installation

```bash
npm install chemparse
```


## Usage

### ES Modules

```js
import ChemParse, {
  parse, validate, compare, compareMany,
  diff, diffMany, ELEMENT_SYMBOLS
} from 'chemparse';

const result = parse( 'CuSO4·5H2O' );

console.log( result ); // { elementCounts: { H: 10, O: 9, S: 1, Cu: 1 } }
console.log( ChemParse.compare( 'H2O', 'OH2' ) ); // true
console.log( ELEMENT_SYMBOLS.length ); // 118
```

All functions are also available as static methods on the default `ChemParse` class.

### CommonJS

```js
const ChemParse = require( 'chemparse' ).default;
const { parse, compare } = require( 'chemparse' );

console.log( parse( 'H2O' ) );
console.log( ChemParse.compare( 'H2O', 'OH2' ) );
console.log( compare( 'H2O', 'OH2' ) );
```

### Browser

ChemParse can also be used in browser environments through an ESM CDN import:

```html
<script type="module">
  import ChemParse, { parse } from 'https://cdn.jsdelivr.net/npm/chemparse@1.1.0/+esm';

  console.log( parse( 'CuSO4·5H2O' ) );
  console.log( ChemParse.validate( 'H2O' ) );
</script>
```

The package provides ESM and CommonJS builds. It does not include a separate UMD build.


## API

All functions are available as named exports and as static methods of the default `ChemParse`
class, unless otherwise noted.

### `parse ( formula: string ) : ChemParseResult`

Parses a chemical formula and returns its element counts and optional ionic charge.

```js
parse( 'H2O' ); // { elementCounts: { H: 2, O: 1 } }
parse( 'SO4^2-' ); // { elementCounts: { O: 4, S: 1 }, charge: -2 }
```

Throws a `TypeError` if the input is not a string and an `Error` if the formula is invalid.

### `validate ( formula: string ) : boolean`

Checks whether a chemical formula is valid.

```js
validate( 'H2O' ); // true
validate( 'Xx2' ); // false
```

Returns `false` for invalid formulas instead of throwing an error.

### `compare ( a: string, b: string ) : boolean`

Compares two formulas for identical element counts and ionic charge.
Element order and formula notation do not affect the result.

```js
compare( 'H2O', 'OH2' ); // true
compare( 'Ca(OH)2', 'CaO2H2' ); // true
compare( 'NH4^+', 'NH4^-' ); // false
```

### `compareMany ( ...formulas: string[] ) : boolean`

Compares two or more formulas against the first formula.

Returns `true` only if all formulas have identical element counts and ionic charge.

```js
compareMany( 'H2O', 'OH2', 'H2O' ); // true
compareMany( 'H2O', 'H2O2', 'H2O' ); // false
```

At least two formulas must be provided.

### `diff ( a: string, b: string ) : ChemParseResult`

Calculates the difference between two formulas by subtracting the element counts
and charge of `b` from `a`.

```js
diff( 'C6H12O6', 'C1.5O3' ); // { elementCounts: { H: 12, C: 4.5, O: 3 } }
```

The `charge` property is included only when the resulting charge difference is nonzero.

### `diffMany ( ...formulas: string[] ) : ( ChemParseResult & { formula: string } )[]`

Calculates the difference between the first formula and each subsequent formula.

Returns one result for every formula after the first.
Each result includes the corresponding input formula in its `formula` property.

```js
diffMany( 'H2O', 'H2', 'O2' );
// [
//   { formula: 'H2', elementCounts: { H: 0, O: 1 } },
//   { formula: 'O2', elementCounts: { H: 2, O: -1 } }
// ]
```

At least two formulas must be provided.

### `ELEMENT_SYMBOLS`

A frozen, readonly tuple containing all 118 supported IUPAC element symbols in periodic table order.

Available as a named export and as `ChemParse.ELEMENT_SYMBOLS`.

```js
console.log( ELEMENT_SYMBOLS.includes( 'Fe' ) ); // true
console.log( ELEMENT_SYMBOLS.length ); // 118
```
