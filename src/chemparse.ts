/**
 * ChemParse
 * A TypeScript library for parsing chemical formulas.
 *
 * Handles nested parentheses, decimal and scientific notation,
 * dot-separated parts (hydrates), leading coefficients, element lists
 * with commas, and ionic charges (caret and superscript notation).
 *
 * Methods:
 *  - parse ( formula: string ) : ChemParseResult
 *  - validate ( formula: string ) : boolean
 *  - compare ( a: string, b: string ) : boolean
 *  - diff ( a: string, b: string ) : ChemParseResult
 *
 * @author Paul Köhler (komed3)
 * @license MIT
 * @version 1.1.0
 */

'use strict';
