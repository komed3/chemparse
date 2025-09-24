# ChemParse

**ChemParse** is a TypeScript library for parsing chemical formulas.

It supports nested parentheses, decimal and scientific notation, dot-separated hydrate parts, and strict validation of IUPAC element symbols.

## Features

- Parses chemical formulas into element counts
- Handles hydrates and dot-separated parts (e.g., `CuSO4·5H2O`)
- Supports nested parentheses/brackets (e.g., `K4[Fe(CN)6]`)
- Accepts decimal and scientific notation (e.g., `C1.5O3`, `H2e-1O1e-1`)
- Strict validation against all 118 IUPAC element symbols
- TypeScript types included

## Installation

```bash
npm install chemparse
```

## Usage

Node.js (CommonJS)

```js
const ChemParse = require( 'chemparse' ).default;

const result = ChemParse.parse( 'CuSO4·5H2O' );
console.log( result ); // { Cu: 1, S: 1, O: 9, H: 10 }
```

Node.js (ESM / TypeScript)

```js
import ChemParse from 'chemparse';

const result = ChemParse.parse( 'K4[Fe(CN)6]' );
console.log( result ); // { K: 4, Fe: 1, C: 6, N: 6 }
```

Browser (via jsDelivr CDN)

```html
<script type="module">
  import ChemParse from 'https://cdn.jsdelivr.net/npm/chemparse/dist/mjs/chemparse.js';

  const result = ChemParse.parse( 'Al2(SO4)3' );
  console.log( result ); // { Al: 2, S: 3, O: 12 }
</script>
```

## API

**`ChemParse.parse ( formula: string ) : Record< ElementSymbol, number >`**  
Parses a chemical formula and returns an object mapping element symbols to their counts.

**`ChemParse.validate ( formula: string ) : boolean`**  
Returns `true` if the formula is valid, otherwise `false`.

**`ChemParse.compare ( a: string, b: string ) : boolean`**  
Returns `true` if both formulas represent the same element distribution.

**`ChemParse.diff ( a: string, b: string ) : Record< ElementSymbol, number >`**  
Returns the difference in element counts between two formulas (`a - b`).

## Supported Formula Syntax

- Simple formulas: `H2O`, `NaMnO4`, `C6H12O6`
- Hydrates and dot notation: `CuSO4·5H2O`, `2.5H2O`, `.5H2O`
- Parentheses and nested groups: `Ca(OH)2`, `(NH4)2SO4`, `K4[Fe(CN)6]`, `Al2(SO4)3`
- Decimal and scientific notation: `C1.5O3`, `H2e-1O1e-1`, `Mg(OH)1.5`, `Fe2(SO4)1.5`
- Leading coefficients: `2H2O`, `5·H2O`

## Example

```js
import ChemParse from 'chemparse';

ChemParse.parse( 'CuSO4·5H2O' );
// => { Cu: 1, S: 1, O: 9, H: 10 }

ChemParse.parse( 'K4[Fe(CN)6]' );
// => { K: 4, Fe: 1, C: 6, N: 6 }

ChemParse.parse( 'C1.5O3' );
// => { C: 1.5, O: 3 }

ChemParse.parse( 'H2e-1O1e-1' );
// => { H: 0.2, O: 0.1 }

ChemParse.validate( 'Fe2(SO4)1.5' );
// => true

ChemParse.compare( 'H2O', 'OH2' );
// => true

ChemParse.diff( 'C6H12O6', 'C1.5O3' );
// => { C: 4.5, H: 12, O: 3 }
```

## License

MIT © Paul Köhler (komed3)