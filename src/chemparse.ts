/**
 * ChemParse
 * A TypeScript library for parsing chemical formulas.
 * 
 * Handles nested parentheses, decimal and scientific notation,
 * dot-separated parts (hydrates), leading coefficients, element lists
 * with commas, and ionic charges (caret and superscript notation).
 * 
 * Methods:
 *  - parse ( formula: string ) : ElementCounts
 *  - validate ( formula: string ) : boolean
 *  - compare ( a: string, b: string ) : boolean
 *  - diff ( a: string, b: string ) : ElementCounts
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @version 1.0.2
 */

'use strict';

/**
 * @typedef ElementSymbol
 * 
 * A union type of all valid chemical element symbols.
 */
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

/**
 * @typedef ElementCounts
 * 
 * An object mapping element symbols to their counts in a chemical formula.
 */
export type ElementCounts = Partial< Record< ElementSymbol, number > >;

/**
 * @interface ChemParseResult
 * 
 * The result of parsing a chemical formula, including element counts
 * and optional ionic charge.
 */
export interface ChemParseResult {
    elementCounts: ElementCounts;
    charge?: number;
};

/**
 * @constant ELEMENT_SYMBOLS
 * 
 * A set of all valid chemical element symbols for quick lookup.
 */
const ELEMENT_SYMBOLS: Set< ElementSymbol > = new Set( [
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
] );

/**
 * @constant NUMBER_REGEX
 * 
 * A regular expression to match numbers, including integers, decimals,
 * and scientific notation.
 */
const NUMBER_REGEX = /^(\d*\.?\d+(?:[eE][+-]?\d+)?)/;

/**
 * @constant CHARGE_REGEX
 * 
 * A regular expression to match charge notation at the end of a formula.
 * Supports formats like "^2+", "3-", "⁺", "²⁻", etc.
 */
const CHARGE_REGEX = /(?:\^([+-]?\d+)?([+-]))$|(?:([⁺⁻\d]+))$/u;

/**
 * @constant SUPERSCRIPT_MAP
 * 
 * A mapping of Unicode superscript characters to their normal equivalents.
 */
const SUPERSCRIPT_MAP: Record<string, string> = {
    '⁺': '+', '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3',
    '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'
};

/**
 * ChemParse
 * 
 * A class providing static methods to parse and analyze chemical formulas.
 */
export default class ChemParse {

    private static _chargeNumber ( match: RegExpMatchArray ) : number {

        const n = match[ 1 ] ? parseInt( match[ 1 ], 10 ) : 1;

        return match[ 2 ] === '+' ? n : -n;

    }

    private static _parseCharge ( match: RegExpMatchArray | null ) : number | undefined {

        if ( ! match ) return undefined;

        // Caret notation: ^2-, ^+, ^3+, ^-, ^+2, ^-3
        if ( match[ 1 ] || match[ 2 ] ) return this._chargeNumber( match );

        // Unicode superscript: ²⁻, ³⁺, ⁻, ⁺
        if ( match[ 3 ] ) {

            let normal = '';

            for ( const ch of match[ 3 ] ) {

                if ( SUPERSCRIPT_MAP[ ch ] ) normal += SUPERSCRIPT_MAP[ ch ];

            }

            const m = normal.match( /^(\d*)([+-])$/ );

            if ( m ) return this._chargeNumber( m );

        }

        return undefined;

    }

    private static _parseCore ( str: string ) : ElementCounts {

        const stack: ElementCounts[] = [ {} ];
        let i = 0;

        while ( i < str.length ) {

            const ch = str[ i ];

            // Opening bracket
            if ( ch === '(' || ch === '[' || ch === '{' ) {

                stack.push( {} );
                i++;

                continue;

            }

            // Closing parenthesis -> optional decimal/scientific multiplier after
            if ( ch === ')' || ch === ']' || ch === '}' ) {

                const remainder = str.slice( ++i );
                const numMatch = remainder.match( NUMBER_REGEX );
                const multiplier = numMatch ? parseFloat( numMatch[ 1 ] ) : 1;

                if ( numMatch ) i += numMatch[ 1 ].length;

                if ( stack.length === 1 ) throw new Error (
                    `Unmatched closing bracket at position ${ ( i - 1 ) } in "${ str }"`
                );

                const popped = stack.pop()!;
                const top = stack[ stack.length - 1 ];

                for ( const [ el, cnt ] of Object.entries( popped ) ) {

                    top[ el as ElementSymbol ] = (
                        top[ el as ElementSymbol ] || 0
                    ) + cnt * multiplier;

                }

                continue;

            }

            // Element symbol: uppercase letter followed by optional lowercase letters
            if ( /[A-Z]/.test( ch ) ) {

                let j = i + 1;

                while ( j < str.length && /[a-z]/.test( str[ j ] ) ) j++;

                const element = str.slice( i, j );
                i = j;

                // Optional counter (can be decimal / scientific)
                const remainder = str.slice( i );
                const numMatch = remainder.match( NUMBER_REGEX );
                const count = numMatch ? parseFloat( numMatch[ 1 ] ) : 1;

                if ( numMatch ) i += numMatch[ 1 ].length;

                if ( ! ELEMENT_SYMBOLS.has( element as ElementSymbol ) ) throw new Error (
                    `Unknown element symbol "${ element }" in formula segment "${ str }"`
                );

                const top = stack[ stack.length - 1 ];

                top[ element as ElementSymbol ] = (
                    top[ element as ElementSymbol ] || 0
                ) + count;

                continue;

            }

            // Anything else is invalid
            throw new Error (
                `Invalid character "${ ch }" at position ${ i } in "${ str }"`
            );

        }

        if ( stack.length !== 1 ) throw new Error (
            `Unmatched opening bracket in formula segment "${ str }"`
        );

        return stack[ 0 ];

    }

}
