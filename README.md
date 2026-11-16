# ChemParse

**ChemParse** is a lightweight TypeScript library for parsing, validating,
and comparing chemical formulas and particle expressions.

It supports all 118 IUPAC element symbols, common subatomic particles, ionic charges,
nested groups, decimal and scientific notation, hydrate notation, and leading coefficients.


## Features

- Parses chemical formulas and particle expressions
- Supports all 118 IUPAC element symbols
- Recognizes common particles: electrons, positrons, protons, neutrons, alpha, beta, gamma, etc.
- Handles nested parentheses, square brackets, and curly brackets
- Supports decimal and scientific notation
- Parses dot-separated and underscore-separated hydrate parts
- Supports leading coefficients and hydrate multipliers
- Accepts comma-separated element lists inside groups
- Recognizes ionic charges in caret and Unicode superscript notation
- Calculates total charge, including leading coefficients
- Compares multiple formulas and particle expressions by composition and charge
- Calculates element count, particle count, and charge differences
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
  ELEMENT_SYMBOLS, PARTICLE_SYMBOLS, compare, compareMany,
  diff, diffMany, parse, validate
} from 'chemparse';

const result = parse( 'CuSO4·5H2O' );

console.log( result ); // { elementCounts: { H: 10, O: 9, S: 1, Cu: 1 } }
console.log( ChemParse.compare( 'H2O', 'OH2' ) ); // true
console.log( ELEMENT_SYMBOLS.length ); // 118
console.log( PARTICLE_SYMBOLS ); // Supported particle symbols
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
  import ChemParse, { parse } from 'https://cdn.jsdelivr.net/npm/chemparse@1.2.0/+esm';

  console.log( parse( 'CuSO4·5H2O' ) );
  console.log( ChemParse.validate( 'H2O' ) );
</script>
```

The package provides ESM and CommonJS builds. It does not include a separate UMD build.


## API

All functions are available as named exports and as static methods of the default `ChemParse`
class, unless otherwise noted.

### `parse ( formula: string ) : ChemParseResult`

Parses a chemical formula or particle expression and returns its element counts,
particle counts, and optional total ionic charge.

```js
parse( 'H2O' ); // { elementCounts: { H: 2, O: 1 } }
parse( 'SO4^2-' ); // { elementCounts: { O: 4, S: 1 }, charge: -2 }
parse( '2SO4^2-' ); // { elementCounts: { O: 8, S: 2 }, charge: -4 }
parse( 'e-' ); // { elementCounts: {}, particleCounts: { e: 1 }, charge: -1 }
parse( '3α' ); // { elementCounts: {}, particleCounts: { α: 3 }, charge: 6 }
```

The `charge` property represents the total charge of the parsed expression.
Leading coefficients multiply the charge as well as the corresponding element or particle counts.

Throws a `TypeError` if the input is not a string and an `Error` if the formula or expression is invalid.

### `validate ( formula: string ) : boolean`

Checks whether a chemical formula or particle expression can be parsed.

```js
validate( 'H2O' ); // true
validate( 'e-' ); // true
validate( 'Xx2' ); // false
```

Returns `false` for invalid input instead of throwing an error.

### `compare ( a: string, b: string ) : boolean`

Compares two formulas or particle expressions for identical element counts, particle counts, and total charge.

Element order and formula notation do not affect the result.

```js
compare( 'H2O', 'OH2' ); // true
compare( 'Ca(OH)2', 'CaO2H2' ); // true
compare( 'NH4^+', 'NH4^-' ); // false
compare( 'e-', 'e+' ); // false
compare( '2e-', 'e-' ); // false
```

### `compareMany ( ...formulas: string[] ) : boolean`

Compares two or more formulas or particle expressions against the first input.

Returns `true` only if all inputs have identical element counts, particle counts, and total charge.

```js
compareMany( 'H2O', 'OH2', 'H2O' ); // true
compareMany( 'H2O', 'H2O2', 'H2O' ); // false
compareMany( 'γ', 'γ', 'γ' ); // true
```

At least two inputs must be provided.

### `diff ( a: string, b: string ) : ChemParseResult`

Calculates the difference between two formulas or particle expressions by subtracting the
element counts, particle counts, and total charge of `b` from `a`.

```js
diff( 'C6H12O6', 'C1.5O3' ); // { elementCounts: { H: 12, C: 4.5, O: 3 } }
diff( '2e-', 'e-' ); // { elementCounts: {}, particleCounts: { e: 1 }, charge: -1 }
diff( '3α', 'α' ); // { elementCounts: {}, particleCounts: { α: 2 }, charge: 4 }
```

The `particleCounts` property is included only if particle differences exist.
The `charge` property is included only when the resulting charge difference is nonzero.

### `diffMany ( ...formulas: string[] ) : ( ChemParseResult & { formula: string } )[]`

Calculates the difference between the first formula or particle expression and each subsequent input.

Returns one result for every input after the first.
Each result includes the corresponding input in its `formula` property.

```js
diffMany( 'H2O', 'H2', 'O2' );
// [
//   { formula: 'H2', elementCounts: { H: 0, O: 1 } },
//   { formula: 'O2', elementCounts: { H: 2, O: -1 } }
// ]
```

At least two inputs must be provided.

### `ELEMENT_SYMBOLS`

A frozen, readonly tuple containing all 118 supported IUPAC element symbols in periodic table order.

Available as a named export and as `ChemParse.ELEMENT_SYMBOLS`.

```js
console.log( ELEMENT_SYMBOLS.includes( 'Fe' ) ); // true
console.log( ELEMENT_SYMBOLS.length ); // 118
```

### `PARTICLE_SYMBOLS`

A frozen, readonly tuple containing all supported particle symbols.

Available as a named export.

```js
console.log( PARTICLE_SYMBOLS ); // [ 'e', 'p', 'n', 'α', 'β', 'γ', 'ν', 'ν̄' ]
console.log( PARTICLE_SYMBOLS.includes( 'α' ) ); // true
```


## Supported Formula Syntax

### Basic formulas

```text
H2O
NaMnO4
C6H12O6
Fe2O3
```

Element symbols are case-sensitive and must match one of the 118 supported IUPAC symbols.

### Parentheses and nested groups

Parentheses, square brackets, and curly brackets can be used to group elements.
Groups can be nested and followed by a multiplier.

```text
Ca(OH)2
(NH4)2SO4
K4[Fe(CN)6]
Al2(SO4)3
{[Fe(CN)6]2}
```

Brackets must be correctly paired and nested. Empty groups and mismatched brackets are rejected.

### Decimal and scientific notation

Element counts, group multipliers, and leading coefficients support decimal and scientific notation.

```text
C1.5O3
Mg(OH)1.5
Fe2(SO4)1.5
H2e-1O1e-1
2.5H2O
```

Counts and multipliers must be finite and positive.

### Hydrates and formula segments

The middle dot (`·`) and underscore (`_`) separate formula segments.
A coefficient at the beginning of a segment multiplies that segment.

```text
CuSO4·5H2O
CuSO4_5H2O
5·H2O
2H2O
```

A coefficient can also appear as a separate segment before the separator.
In that case, it multiplies the following segment.

For example:

```js
parse( 'CuSO4·5H2O' ); // { elementCounts: { H: 10, O: 9, S: 1, Cu: 1 } }
parse( '5·H2O' ); // { elementCounts: { H: 10, O: 5 } }
```

### Comma-separated element lists

Commas can separate elements inside a group. Commas between digits are interpreted as decimal separators.

```text
Fe2(S,O4)
Al2(S,O4)3
```

```js
parse( 'Al2(S,O4)3' ); // { elementCounts: { O: 12, Al: 2, S: 3 } }
```

Comma-separated element lists are only supported inside groups.

### Particles

ChemParse recognizes the following particle symbols:

| Particle | Symbol | Charge |
|---|---|---:|
| Electron | `e-` | −1 |
| Positron | `e+` | +1 |
| Proton | `p+` | +1 |
| Neutron | `n` | 0 |
| Alpha particle | `α` | +2 |
| Beta-minus particle | `β-` | −1 |
| Beta-plus particle | `β+` | +1 |
| Gamma particle | `γ` | 0 |
| Neutrino | `ν` | 0 |
| Antineutrino | `ν̄` | 0 |

Particle counts are returned separately from element counts.
Explicit particle charges are represented by the `charge` property.

```js
parse( 'e-' ); // { elementCounts: {}, particleCounts: { e: 1 }, charge: -1 }
parse( 'p+' ); // { elementCounts: {}, particleCounts: { p: 1 }, charge: 1 }
parse( 'α' ); // { elementCounts: {}, particleCounts: { α: 1 }, charge: 2 }
parse( 'β-' ); // { elementCounts: {}, particleCounts: { β: 1 }, charge: -1 }
parse( 'ν̄' ); // { elementCounts: {}, particleCounts: { 'ν̄': 1 } }
```

Leading coefficients multiply particle counts and total charge:

```js
parse( '2e-' ); // { elementCounts: {}, particleCounts: { e: 2 }, charge: -2 }
parse( '3α' ); // { elementCounts: {}, particleCounts: { α: 3 }, charge: 6 }
```

Particles are parsed as standalone expressions.
They are not currently supported as members of mixed element-and-particle formulas.

### Ionic charges

Ionic charges can be expressed using caret notation or Unicode superscript characters.

Supported caret notation:

```text
SO4^2-
NH4^+
CH3COO^-
Fe(CN)6^3-
SO4^-2
SO4^+2
```

Supported Unicode superscript notation:

```text
SO4²⁻
NH4⁺
CH3COO⁻
```

The charge is returned as a signed integer:

```js
parse( 'SO4^2-' ); // { elementCounts: { O: 4, S: 1 }, charge: -2 }
parse( 'NH4^+' ); // { elementCounts: { H: 4, N: 1 }, charge: 1 }
```

Leading coefficients multiply the total charge:

```js
parse( '2SO4^2-' ); // { elementCounts: { O: 8, S: 2 }, charge: -4 }
```

Formulas without an explicit or intrinsically defined charge do not contain a `charge` property in the result.


## Result Format

`parse()` returns a `ChemParseResult` object:

```ts
interface ChemParseResult {
  elementCounts: ElementCounts;
  particleCounts?: ParticleCounts;
  charge?: number;
}
```

`ElementCounts` maps supported element symbols to their numerical counts:

```ts
type ElementCounts = Partial< Record< ElementSymbol, number > >;
```

`ParticleCounts` maps supported particle symbols to their numerical counts:

```ts
type ParticleCounts = Partial< Record< ParticleSymbol, number > >;
```

The `elementCounts` property is always present.
It is an empty object when parsing a standalone particle expression.

The `particleCounts` property is only present when the input contains particles.

The `charge` property is only present when an explicit or intrinsic charge is found.
It represents the total charge, including any leading coefficient.

Element entries are ordered according to the periodic table.
Particle entries follow the order defined in `PARTICLE_SYMBOLS`.

For example:

```js
parse( 'CuSO4·5H2O' );
// {
//   elementCounts: {
//     H: 10,
//     O: 9,
//     S: 1,
//     Cu: 1
//   }
// }
```

Difference results may also contain negative or zero element and particle counts.


## Parser Scope and Limitations

ChemParse parses and compares formula syntax. It does not attempt to determine whether a formula
or particle expression is chemically or physically meaningful.

Some limitations of the current parser:

- Particle expressions are supported as standalone inputs; combining particles and chemical
  elements in one expression is not currently supported.
- Ionic charges are parsed as a trailing charge for the complete input. Charges attached to
  individual groups or individual hydrate segments are not supported.
- The parser does not balance chemical reactions, interpret isotopic notation,
  or validate chemical plausibility.


## Error Handling

`parse()` throws an error when the input is syntactically invalid. Examples include:

- Empty formulas
- Unknown or incorrectly cased element symbols
- Invalid characters
- Unmatched or mismatched brackets
- Empty groups
- Invalid comma placement
- Missing or invalid numerical counts
- Non-finite or non-positive counts and multipliers
- Empty hydrate segments or trailing hydrate coefficients
- Invalid ionic charges

`validate()` can be used when a boolean result is preferred over exception handling.


## TypeScript

ChemParse includes declaration files and exports its public types:

```ts
import type { ChemParseResult, ElementCounts, ElementSymbol, ParticleSymbol } from 'chemparse';
import ChemParse, { parse, ELEMENT_SYMBOLS, PARTICLE_SYMBOLS } from 'chemparse';

const result: ChemParseResult = parse( 'H2O' );
const symbols: readonly ElementSymbol[] = ELEMENT_SYMBOLS;
const counts: ElementCounts = result.elementCounts;
const particles: readonly ParticleSymbol[] = PARTICLE_SYMBOLS;
```


## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.  
© Copyright 2025-2026 Paul Köhler (komed3).
