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


/** All supported IUPAC element symbols. */
export const ELEMENT_SYMBOLS = Object.freeze( [
  'H',  'He', 'Li', 'Be', 'B',  'C',  'N',  'O',  'F',  'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P',  'S',  'Cl', 'Ar', 'K',  'Ca',
  'Sc', 'Ti', 'V',  'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y',  'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
  'Sb', 'Te', 'I',  'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
  'Lu', 'Hf', 'Ta', 'W',  'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
  'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
  'Pa', 'U',  'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
  'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds',
  'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'
] as const );


/** A supported chemical element symbol. */
export type ElementSymbol = typeof ELEMENT_SYMBOLS[ number ];

/** Element counts indexed by their chemical symbols. */
export type ElementCounts = Partial< Record< ElementSymbol, number > >;

/**
 * Result of parsing a chemical formula.
 *
 * @property elementCounts Element counts indexed by their symbols.
 * @property charge (optional) Ionic charge. Positive for cations, negative for anions.
 */
export interface ChemParseResult {
  elementCounts: ElementCounts;
  charge?: number;
}


// Internal parser types

interface ParserFrame {
  counts: ElementCounts;
  opener?: string;
  afterComma: boolean;
}


// Internal lookup and parsing constants

const ELEMENT_SET = new Set< string >( ELEMENT_SYMBOLS );
const SUPERSCRIPT_MAP: Record< string, string > = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-'
};

const WHITESPACES_REGEX = /\s+/g;
const NORMALIZE_REGEX = /([0-9]),([0-9])/g;
const NUMBER_REGEX = /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/;
const CHANGE_REGEX = /\^(?:(\d*)([+-])|([+-])(\d+))$|([⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])$/u;
const NUMBER_SIGN_REGEX = /^(\d*)([+-])$/;
const PART_REGEX = /[·_]/;


/**
 * Reads a positive finite number at the given position.
 *
 * @returns The parsed number and the next position, or undefined if no number starts at the given position.
 * @throws {Error} If the parsed number is not finite or positive.
 */
function readNumber ( value: string, position: number ) : [ number, number ] | undefined {
  const match = value.slice( position ).match( NUMBER_REGEX );
  if ( ! match ) return undefined;

  const number = Number( match[ 0 ] );
  if ( ! Number.isFinite( number ) || number <= 0 )
    throw new Error( `Invalid count "${ match[ 0 ] }": counts must be finite and positive` );

  return [ number, position + match[ 0 ].length ];
}

/**
 * Adds element counts to a target, applying an optional multiplier.
 *
 * @throws {Error} If a resulting element count is not finite or positive.
 */
function mergeCounts ( target: ElementCounts, source: ElementCounts, multiplier = 1 ) : void {
  for ( const [ el, count ] of Object.entries( source ) as [ ElementSymbol, number ][] ) {
    const result = ( target[ el ] || 0 ) + count * multiplier;

    if ( ! Number.isFinite( result ) || result <= 0 )
      throw new Error( `Invalid count for ${ el }: counts must be finite and positive` );

    target[ el ] = result;
  }
}

/**
 * Extracts an ionic charge from a formula.
 *
 * @returns The formula without its charge and the parsed charge, or undefined if none exists.
 * @throws {Error} If the ionic charge is invalid.
 */
function parseCharge ( formula: string ) : [ string, number | undefined ] {
  const match = formula.match( CHANGE_REGEX );
  if ( ! match ) return [ formula, undefined ];

  const normalized = match[ 5 ] !== undefined
    ? Array.from( match[ 5 ], c => SUPERSCRIPT_MAP[ c ] ).join( '' )
    : match[ 3 ] !== undefined
      ? `${ match[ 4 ] }${ match[ 3 ] }`
      : `${ match[ 1 ] }${ match[ 2 ] }`;

  const parsed = normalized.match( NUMBER_SIGN_REGEX );
  if ( ! parsed ) throw new Error( 'Invalid ionic charge.' );

  const value = Number( parsed[ 1 ] || 1 );
  if ( ! Number.isSafeInteger( value ) || value <= 0 ) throw new Error( 'Invalid ionic charge.' );

  return [ formula.slice( 0, match.index ), parsed[ 2 ] === '+' ? value : -value ];
}

/**
 * Parses a formula segment into its element counts.
 *
 * @throws {Error} If the formula contains invalid symbols, brackets, commas or counts.
 */
function parseSegment ( formula: string ) : ElementCounts {
  const stack: ParserFrame[] = [ { counts: {}, afterComma: false } ];
  let pos = 0;

  while ( pos < formula.length ) {
    const char = formula[ pos ], frame = stack[ stack.length - 1 ], counts = frame.counts;

    if ( '([{'.includes( char ) ) {
      frame.afterComma = false;
      stack.push( { counts: {}, opener: char, afterComma: false } );
      pos++;

      continue;
    }

    if ( ')]}'.includes( char ) ) {
      if ( stack.length === 1 ) throw new Error( `Unmatched closing bracket at pos ${ pos }.` );
      if ( frame.afterComma ) throw new Error( `Invalid comma at position ${ pos - 1 }.` );
      if ( Object.keys( counts ).length === 0 ) throw new Error( 'Empty groups are not allowed.' );

      if ( frame.opener !== ( char === ')' ? '(' : char === ']' ? '[' : '{' ) )
        throw new Error( `Mismatched closing bracket at pos ${ pos }.` );

      stack.pop();
      pos++;

      const parsed = readNumber( formula, pos );
      if ( parsed ) pos = parsed[ 1 ];

      mergeCounts( stack[ stack.length - 1 ].counts, counts, parsed?.[ 0 ] || 1 );
      continue;
    }

    if ( char === ',' ) {
      if ( stack.length === 1 || frame.afterComma || ! Object.keys( counts ).length )
        throw new Error( `Invalid comma at position ${ pos }.` );

      frame.afterComma = true;
      pos++;
      continue;
    }

    if ( char >= 'A' && char <= 'Z' ) {
      let end = pos + 1;
      while ( end < formula.length && formula[ end ] >= 'a' && formula[ end ] <= 'z' ) end++;

      const el = formula.slice( pos, end );
      if ( ! ELEMENT_SET.has( el ) ) throw new Error( `Unknown element symbol "${ el }".` );

      pos = end;

      const parsed = readNumber( formula, pos );
      if ( parsed ) pos = parsed[ 1 ];

      frame.afterComma = false;
      mergeCounts( counts, { [ el ]: parsed?.[ 0 ] || 1 } );
      continue;
    }

    throw new Error( `Invalid character "${ char }" at position ${ pos }.` );
  }

  if ( stack.length !== 1 ) throw new Error( 'Unmatched opening bracket.' );
  return stack[ 0 ].counts;
}

/** Normalizes a formula by removing whitespace and replacing commas with dots. */
function normalizeFormula ( formula: string ) : string {
  return formula.replace( WHITESPACES_REGEX, '' ).replace( NORMALIZE_REGEX, '$1.$2' );
}


/**
 * Parses a chemical formula into its element counts and optional ionic charge.
 *
 * @param formula The chemical formula to parse.
 * @returns The parsed element counts and optional ionic charge.
 * @throws {TypeError} If the formula is not a string.
 * @throws {Error} If the formula or any of its segments is invalid.
 */
export function parse ( formula: string ) : ChemParseResult {
  if ( typeof formula !== 'string' ) throw new TypeError( 'Formula must be a string.' );

  const normalized = normalizeFormula( formula );
  if ( ! normalized ) throw new Error( 'Formula must not be empty.' );

  const [ mainFormula, charge ] = parseCharge( normalized );
  const parts = mainFormula.split( PART_REGEX );

  if ( parts.some( p => ! p ) ) throw new Error( 'Formula contains an empty hydrate segment.' );

  const counts: ElementCounts = {};
  let pendingMultiplier = 1;

  for ( let i = 0; i < parts.length; i++ ) {
    const leading = readNumber( parts[ i ], 0 );
    const part = leading ? parts[ i ].slice( leading[ 1 ] ) : parts[ i ];
    const multiplier = pendingMultiplier * ( leading?.[ 0 ] || 1 );

    if ( ! Number.isFinite( multiplier ) || multiplier <= 0 )
      throw new Error( 'Invalid hydrate multiplier.' );

    if ( ! part ) {
      if ( i === parts.length - 1 )
        throw new Error( 'Formula contains a hydrate coefficient without a following segment.' );

      pendingMultiplier = multiplier;
      continue;
    }

    pendingMultiplier = 1;
    mergeCounts( counts, parseSegment( part ), multiplier );
  }

  if ( ! Object.keys( counts ).length )
    throw new Error( 'Formula must contain at least one element.' );

  const elementCounts: ElementCounts = {};
  for ( const el of ELEMENT_SYMBOLS ) if ( el in counts ) elementCounts[ el ] = counts[ el ];

  return charge === undefined ? { elementCounts } : { elementCounts, charge };
}


export function validate ( formula: string ) : boolean {
  try { parse( formula ); return true }
  catch { return false }
}


export function compareMany ( ...formulas: string[] ) : boolean {
  if ( formulas.length < 2 ) throw new Error( 'At least two formulas must be provided.' );

  const first = parse( formulas[ 0 ] );

  for ( let i = 1; i < formulas.length; i++ ) {
    const current = parse( formulas[ i ] );
    if ( first.charge !== current.charge ) return false;

    for ( const el of ELEMENT_SYMBOLS )
      if ( ( first.elementCounts[ el ] || 0 ) !== ( current.elementCounts[ el ] || 0 ) )
        return false;
  }

  return true;
}


export function compare ( a: string, b: string ) : boolean {
  return compareMany( a, b );
}


export function diffMany ( ...formulas: string[] ) : ( ChemParseResult & { formula: string } )[] {
  if ( formulas.length < 2 ) throw new Error( 'At least two formulas must be provided.' );

  const first = parse( formulas[ 0 ] );
  const results: ( ChemParseResult & { formula: string } )[] = [];

  for ( let i = 1; i < formulas.length; i++ ) {
    const current = parse( formulas[ i ] );
    const elementCounts: ElementCounts = {};

    for ( const el of ELEMENT_SYMBOLS )
      if ( el in first.elementCounts || el in current.elementCounts )
        elementCounts[ el ] = ( first.elementCounts[ el ] || 0 ) -
          ( current.elementCounts[ el ] || 0 );

    const charge = ( first.charge || 0 ) - ( current.charge || 0 );
    results.push( charge === 0 ? { formula: formulas[ i ], elementCounts } : {
      formula: formulas[ i ], elementCounts, charge
    } );
  }

  return results;
}


export function diff ( a: string, b: string ) : ChemParseResult {
  const [ { elementCounts, charge } ] = diffMany( a, b );
  return charge === undefined ? { elementCounts } : { elementCounts, charge };
}


export default class ChemParse {
  public static readonly ELEMENT_SYMBOLS = ELEMENT_SYMBOLS;

  public static readonly parse = parse;
  public static readonly validate = validate;
  public static readonly compare = compare;
  public static readonly compareMany = compareMany;
  public static readonly diff = diff;
  public static readonly diffMany = diffMany;
}
