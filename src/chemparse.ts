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
const NUMBER_REGEX = /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/;
const SUPERSCRIPT_MAP: Record< string, string > = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-'
};
