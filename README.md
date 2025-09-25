# ChemParse

**ChemParse** is a lightweight TypeScript library for parsing chemical formulas.

It supports nested parentheses, decimal and scientific notation, dot-separated hydrate parts, ionic charges, and strict validation of IUPAC element symbols.

## Features

- Parses chemical formulas into element counts
- Handles hydrates and dot-separated parts (e.g., `CuSO4·5H2O`, `CCl3_CH(OH)2`)
- Supports nested parentheses/brackets (e.g., `K4[Fe(CN)6]`)
- Accepts decimal and scientific notation (e.g., `C1.5O3`, `H2e-1O1e-1`)
- Handles ionic charges (e.g., `SO4^2-`, `NH4^+`)
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
console.log( result );
// { elementCounts: { H: 10, O: 9, S: 1, Cu: 1 } }
```

Node.js (ESM / TypeScript)

```js
import ChemParse from 'chemparse';

const result = ChemParse.parse( 'K4[Fe(CN)6]' );
console.log( result );
// { elementCounts: { C: 6, N: 6, K: 4, Fe: 1 } }
```

The package can also be used in browser environments.  
To do so, simply load the script as UMD or ESM from jsDelivr:  
https://jsdelivr.com/package/npm/chemparse

```html
<script type="module">
  import ChemParse from 'https://cdn.jsdelivr.net/npm/chemparse@1.0.1/+esm'

  const result = ChemParse.parse( 'CH3COO^-' );
  console.log( result );
  // { elementCounts: { H: 3, C: 2, O: 2 }, charge: -1 }
</script>
```

## API

**`ChemParse.parse ( formula: string ) : ChemParseResult`**  
Pases a chemical formula and returns an object mapping element symbols to their counts and optional charge.

**`ChemParse.validate ( formula: string ) : boolean`**  
Returns `true` if the formula is valid, otherwise `false`.

**`ChemParse.compare ( a: string, b: string ) : boolean`**  
Returns `true` if both formulas represent the same element distribution.

**`ChemParse.diff ( a: string, b: string ) : ChemParseResult`**  
Returns the difference in element counts and ionic charge between two formulas (`a - b`).

## Supported Formula Syntax

- Simple formulas: `H2O`, `NaMnO4`, `C6H12O6`
- Hydrates and dot notation: `CuSO4·5H2O`, `CCl3_CH(OH)2`, `2.5H2O`, `.5H2O`
- Parentheses and nested groups: `Ca(OH)2`, `(NH4)2SO4`, `K4[Fe(CN)6]`, `Al2(SO4)3`
- Decimal and scientific notation: `C1.5O3`, `H2e-1O1e-1`, `Mg(OH)1.5`, `Fe2(SO4)1.5`
- Leading coefficients: `2H2O`, `5·H2O`
- Ionic charges: `SO4^2-`, `NH4^+`, `CH3COO^-`, `Fe(CN)6^3-`

## Example

```js
import ChemParse from 'chemparse';

console.log( ChemParse.parse( 'CuSO4·5H2O' ) );
// => { elementCounts: { H: 10, O: 9, S: 1, Cu: 1 } }

console.log( ChemParse.parse( 'K4[Fe(CN)6]' ) );
// => { elementCounts: { C: 6, N: 6, K: 4, Fe: 1 } }

console.log( ChemParse.parse( 'C1.5O3' ) );
// => { elementCounts: { C: 1.5, O: 1 } }

console.log( ChemParse.parse( 'H2e-1O1e-1' ) );
// => { elementCounts: { H: 0.2, O: 0.1 } }

console.log( ChemParse.parse( 'CH3COO^-' ) );
// => { elementCounts: { H: 3, C: 2, O: 2 }, charge: -1 }

console.log( ChemParse.parse( 'Fe(CN)6^3-' ) );
// => { elementCounts: { C: 6, N: 6, Fe: 1 }, charge: -3 }

console.log( ChemParse.validate( 'Fe2(SO4)1.5' ) );
// => true

console.log( ChemParse.compare( 'H2O', 'OH2' ) );
// => true

console.log( ChemParse.diff( 'C6H12O6', 'C1.5O3' ) );
// => { elementCounts: { H: 12, C: 4.5, O: 0 } }
```

## License

MIT © Paul Köhler (komed3)