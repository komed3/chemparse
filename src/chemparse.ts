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


export type ElementSymbol =
  | 'H'  | 'He' | 'Li' | 'Be' | 'B'  | 'C'  | 'N'  | 'O'  | 'F'  | 'Ne'
  | 'Na' | 'Mg' | 'Al' | 'Si' | 'P'  | 'S'  | 'Cl' | 'Ar' | 'K'  | 'Ca'
  | 'Sc' | 'Ti' | 'V'  | 'Cr' | 'Mn' | 'Fe' | 'Co' | 'Ni' | 'Cu' | 'Zn'
  | 'Ga' | 'Ge' | 'As' | 'Se' | 'Br' | 'Kr' | 'Rb' | 'Sr' | 'Y'  | 'Zr'
  | 'Nb' | 'Mo' | 'Tc' | 'Ru' | 'Rh' | 'Pd' | 'Ag' | 'Cd' | 'In' | 'Sn'
  | 'Sb' | 'Te' | 'I'  | 'Xe' | 'Cs' | 'Ba' | 'La' | 'Ce' | 'Pr' | 'Nd'
  | 'Pm' | 'Sm' | 'Eu' | 'Gd' | 'Tb' | 'Dy' | 'Ho' | 'Er' | 'Tm' | 'Yb'
  | 'Lu' | 'Hf' | 'Ta' | 'W'  | 'Re' | 'Os' | 'Ir' | 'Pt' | 'Au' | 'Hg'
  | 'Tl' | 'Pb' | 'Bi' | 'Po' | 'At' | 'Rn' | 'Fr' | 'Ra' | 'Ac' | 'Th'
  | 'Pa' | 'U'  | 'Np' | 'Pu' | 'Am' | 'Cm' | 'Bk' | 'Cf' | 'Es' | 'Fm'
  | 'Md' | 'No' | 'Lr' | 'Rf' | 'Db' | 'Sg' | 'Bh' | 'Hs' | 'Mt' | 'Ds'
  | 'Rg' | 'Cn' | 'Fl' | 'Lv' | 'Ts' | 'Og';

export type ElementCounts = Partial< Record< ElementSymbol, number > >;

export interface ChemParseResult {
  elementCounts: ElementCounts;
  charge?: number;
}

interface ParserFrame {
  counts: ElementCounts;
  opener?: string;
}


const ELEMENT_SYMBOLS: ElementSymbol[] = [
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
  'Rg', 'Cn', 'Fl', 'Lv', 'Ts', 'Og'
];

const ELEMENT_SET = new Set< string >( ELEMENT_SYMBOLS );
const SUPERSCRIPT_MAP: Record< string, string > = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-'
};

const NUMBER_REGEX = /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/;
const CHANGE_REGEX = /\^(\d*)([+-])$|([⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])$/u;
const NUMBER_SIGN_REGEX = /^(\d*)([+-])$/;
const WHITESPACES_REGEX = /\s+/g;
const NORMALICE_REGEX = /([0-9]),([0-9])/g;

function readNumber ( value: string, position: number ) : [ number, number ] | undefined {
  const match = value.slice( position ).match( NUMBER_REGEX );
  if ( ! match ) return undefined;

  const number = Number( match[ 0 ] );
  if ( ! Number.isFinite( number ) || number <= 0 ) throw new Error(
    `Invalid count "${ match[ 0 ] }": counts must be finite and positive`
  );

  return [ number, position + match[ 0 ].length ];
}

function mergeCounts ( target: ElementCounts, source: ElementCounts, multiplier = 1 ) : void {
  for ( const [ element, count ] of Object.entries( source ) as [ ElementSymbol, number ][] ) {
    const result = ( target[ element ] || 0 ) + count * multiplier;

    if ( ! Number.isFinite( result ) || result <= 0 ) throw new Error(
      `Invalid count for ${ element }: counts must be finite and positive`
    );

    target[ element ] = result;
  }
}

function parseCharge ( formula: string ) : [ string, number | undefined ] {
  const match = formula.match( CHANGE_REGEX );
  if ( ! match ) return [ formula, undefined ];

  let value: number, sign: string;

  if ( match[ 1 ] !== undefined ) {
    value = match[ 1 ] ? Number( match[ 1 ] ) : 1;
    sign = match[ 2 ];
  } else {
    const normalized = Array.from( match[ 3 ] ).map( char => SUPERSCRIPT_MAP[ char ] ).join( '' );

    const parsed = normalized.match( NUMBER_SIGN_REGEX );
    if ( ! parsed ) throw new Error( 'Invalid ionic charge.' );

    value = parsed[ 1 ] ? Number( parsed[ 1 ] ) : 1;
    sign = parsed[ 2 ];
  }

  if ( ! Number.isSafeInteger( value ) || value <= 0 ) throw new Error( 'Invalid ionic charge.' );
  return [ formula.slice( 0, match.index ), sign === '+' ? value : -value ];
}

function parseSegment ( formula: string ) : ElementCounts {
  const stack: ParserFrame[] = [ { counts: {} } ];
  let position = 0;

  while ( position < formula.length ) {
    const char = formula[ position ];

    if ( char === '(' || char === '[' || char === '{' ) {
      stack.push( { counts: {}, opener: char } );
      position++;
      continue;
    }

    if ( char === ')' || char === ']' || char === '}' ) {
      if ( stack.length === 1 ) throw new Error(
        `Unmatched closing bracket at position ${ position }.`
      );

      const frame = stack[ stack.length - 1 ];
      const expected = char === ')' ? '(' : char === ']' ? '[' : '{';

      if ( frame.opener !== expected ) throw new Error(
        `Mismatched closing bracket at position ${ position }.`
      );

      if ( Object.keys( frame.counts ).length === 0 ) throw new Error(
        'Empty groups are not allowed.'
      );

      stack.pop();
      position++;

      const parsed = readNumber( formula, position );
      const multiplier = parsed?.[ 0 ] || 1;

      if ( parsed ) position = parsed[ 1 ];

      mergeCounts( stack[ stack.length - 1 ].counts, frame.counts, multiplier );
      continue;
    }

    if ( char === ',' ) {
      if ( stack.length === 1 ) throw new Error( `Invalid comma at position ${ position }.` );

      position++;
      continue;
    }

    if ( char >= 'A' && char <= 'Z' ) {
      let end = position + 1;

      while ( end < formula.length && formula[ end ] >= 'a' && formula[ end ] <= 'z' ) end++;

      const element = formula.slice( position, end );
      if ( ! ELEMENT_SET.has( element ) ) throw new Error(
        `Unknown element symbol "${ element }".`
      );

      position = end;

      const parsed = readNumber( formula, position );
      const count = parsed?.[ 0 ] || 1;

      if ( parsed ) position = parsed[ 1 ];

      mergeCounts( stack[ stack.length - 1 ].counts, { [ element ]: count } );
      continue;
    }

    throw new Error( `Invalid character "${ char }" at position ${ position }.` );
  }

  if ( stack.length !== 1 ) throw new Error( 'Unmatched opening bracket.' );
  return stack[ 0 ].counts;
}

function normalizeFormula ( formula: string ) : string {
  return formula.replace( WHITESPACES_REGEX, '' ).replace( NORMALICE_REGEX, '$1.$2' );
}


export function parse ( formula: string ) : ChemParseResult {
  if ( typeof formula !== 'string' ) throw new TypeError( 'Formula must be a string.' );

  let normalized = normalizeFormula( formula );
  if ( ! normalized ) throw new Error( 'Formula must not be empty.' );

  const [ mainFormula, charge ] = parseCharge( normalized );
  normalized = mainFormula;

  const parts = normalized.split( /[·_]/ );
  if ( parts.some( part => ! part ) ) throw new Error(
    'Formula contains an empty hydrate segment.'
  );

  const counts: ElementCounts = {};

  for ( let part of parts ) {
    const leading = readNumber( part, 0 );
    let multiplier = 1;

    if ( leading ) multiplier = leading[ 0 ], part = part.slice( leading[ 1 ] );
    if ( ! part ) continue;

    mergeCounts( counts, parseSegment( part ), multiplier );
  }

  if ( Object.keys( counts ).length === 0 ) throw new Error(
    'Formula must contain at least one element.'
  );

  const elementCounts: ElementCounts = {};

  for ( const element of ELEMENT_SYMBOLS )
    if ( element in counts ) elementCounts[ element ] = counts[ element ];

  return charge === undefined ? { elementCounts } : { elementCounts, charge };
}
