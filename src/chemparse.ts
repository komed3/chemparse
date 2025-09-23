/**
 * ChemParse
 * A TypeScript library for parsing chemical formulas.
 * 
 * Handles nested parentheses, decimal and scientific notation,
 * and dot-separated parts (hydrates).
 * 
 * Methods:
 *  - parse ( formula: string ) : ElementCounts
 *  - validate ( formula: string ) : boolean
 *  - compare ( a: string, b: string ) : boolean
 *  - diff ( a: string, b: string ) : ElementCounts
 * 
 * @author Paul Köhler (komed3)
 * @license MIT
 * @version 1.0.0
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

export default class ChemParse {

    /**
     * Core parsing logic for a single segment of a chemical formula (without
     * leading coefficients or dot-separated parts).
     *
     * @param str - The formula segment to parse.
     * @return - An object mapping element symbols to their counts.
     * @throws {Error} If the segment contains unknown element symbols or is malformed.
     */
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

    /**
     * Parse a chemical formula into its constituent elements and their counts.
     * 
     * @param formula - The chemical formula to parse (e.g., "H2O", "C6H12O6").
     * @return - An object mapping element symbols to their counts.
     * @throws {TypeError} If the input is not a string.
     * @throws {Error} If the formula contains unknown element symbols or is malformed.
     */
    public static parse ( formula: string ) : ElementCounts {

        if ( typeof formula !== 'string' ) throw new TypeError (
            `Formula must be a string.`
        );

        // Normalize and split into parts by Unicode middle dot (·)
        const parts = formula
            .replace( /\s+/g, '' )
            .split( '·' )
            .filter( p => p.length > 0 );

        const total: ElementCounts = {};

        for ( let part of parts ) {

            // Leading coefficients (can be decimal / scientific)
            let leadingCoef = 1;
            const leadingMatch = part.match( NUMBER_REGEX );

            if ( leadingMatch && leadingMatch.index === 0 ) {

                leadingCoef = parseFloat( leadingMatch[ 1 ] );
                part = part.slice( leadingMatch[ 1 ].length );

                // Part is just a number -> nothing further to do
                if ( part.length === 0 ) continue;

            }

            const partCounts = this._parseCore( part );

            // Merge parts and scale by leadingCoef
            for ( const [ el, cnt ] of Object.entries( partCounts ) ) {

                if ( ! ELEMENT_SYMBOLS.has( el as ElementSymbol ) ) throw new Error (
                    `Unknown element symbol "${ el }" in formula "${ formula }"`
                );

                total[ el as ElementSymbol ] = (
                    total[ el as ElementSymbol ] || 0
                ) + cnt * leadingCoef;

            }

        }

        return total;

    }

    /**
     * Validates a chemical formula.
     * 
     * @param formula - The chemical formula to validate.
     * @return - True if the formula is valid, false otherwise.
     */
    public static validate ( formula: string ) : boolean {

        try { this.parse( formula ) }
        catch { return false }

        return true;

    }

    /**
     * Compares two chemical formulas for equality (element distribution).
     * 
     * @param a - The first chemical formula.
     * @param b - The second chemical formula.
     * @return - True if both formulas represent the same element distribution, false otherwise.
     */
    public static compare ( a: string, b: string ) : boolean {

        try {

            const pa = this.parse( a );
            const pb = this.parse( b );
            const keysA = Object.keys( pa ).sort();
            const keysB = Object.keys( pb ).sort();

            if ( keysA.length !== keysB.length ) return false;

            for ( let i = 0; i < keysA.length; i++ ) {

                if ( ( keysA[ i ] !== keysB[ i ] ) || ( Math.abs(
                    ( pa as any )[ keysA[ i ] ] - ( pb as any )[ keysB[ i ] ]
                ) > 1e-12 ) ) return false;

            }

            return true;

        } catch { return false }

    }

    /**
     * Returns the difference in element counts between two chemical formulas.
     * 
     * @param a - The first chemical formula.
     * @param b - The second chemical formula.
     * @return - An object mapping element symbols to the difference in their counts (a - b).
     */
    public static diff ( a: string, b: string ) : ElementCounts {

        const pa = this.parse( a );
        const pb = this.parse( b );

        const diff: ElementCounts = {};
        const allKeys = new Set< ElementSymbol >( [
            ...Object.keys( pa ) as ElementSymbol[],
            ...Object.keys( pb ) as ElementSymbol[]
        ] );

        for ( const el of allKeys ) {

            diff[ el ] = ( pa[ el ] || 0 ) - ( pb[ el ] || 0 );

        }

        return diff;

    }

}
