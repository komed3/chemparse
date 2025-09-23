/**
 * ChemParse
 * A TypeScript library for parsing chemical formulas.
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
 * @typedef ElementCounts
 * 
 * An object mapping element symbols to their counts in a chemical formula.
 */
export type ElementCounts = Partial< Record< ElementSymbol, number > >;

export default class ChemParse {

    /**
     * Parse a chemical formula into its constituent elements and their counts.
     * 
     * @param formula - The chemical formula to parse (e.g., "H2O", "C6H12O6").
     * @return - An object mapping element symbols to their counts.
     */
    public static parse ( formula: string ) : ElementCounts {

        if ( typeof formula !== 'string' ) throw new TypeError (
            `Formula must be a string.`
        );

        // Normalize and split into parts by Unicode middle dot (·)
        const normalized = formula
            .replace( /\s+/g, '' )
            .replace( /\u00B7/g, '·' );

        const parts = normalized
            .split( '·' )
            .filter( p => p.length > 0 );

        const total: ElementCounts = {};
        const numberRegex = /^(\d*\.?\d+(?:[eE][+-]?\d+)?)/;

        for ( let part of parts ) {

            // Leading coefficients (can be decimal / scientific)
            let leadingCoef = 1;
            const leadingMatch = part.match( numberRegex );

            if ( leadingMatch && leadingMatch.index === 0 ) {

                leadingCoef = parseFloat( leadingMatch[ 1 ] );
                part = part.slice( leadingMatch[ 1 ].length );

                // Part is just a number -> nothing further to do
                if ( part.length === 0 ) continue;

            }

            const partCounts = this._parseCore( part, numberRegex );

            // Merge parts and scale by leadingCoef
            for ( const [ el, cnt ] of Object.entries( partCounts ) ) {

                if ( ! ELEMENT_SYMBOLS.has( el as ElementSymbol ) ) throw new Error (
                    `Unknown element symbol "${el}" in formula "${formula}"`
                );

                total[ el as ElementSymbol ] = (
                    total[ el as ElementSymbol ] || 0
                ) + cnt * leadingCoef;

            }

        }

        return total;

    }

}
