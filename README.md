# ChemParse

**ChemParse** is a lightweight TypeScript library for parsing and comparing chemical formulas.

It supports all 118 IUPAC element symbols, nested groups, decimal and scientific notation, hydrate notation,
leading coefficients, element lists, and ionic charges.


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
