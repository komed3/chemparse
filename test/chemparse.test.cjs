'use strict';


const assert = require( 'node:assert/strict' );
const test = require( 'node:test' );

const ChemParse = require( '../dist/chemparse.cjs' ).default;
const { ELEMENT_SYMBOLS, parse, validate, compare, compareMany, diff, diffMany } = require( '../dist/chemparse.cjs' );


test( 'exports', async t => {
  await t.test( 'CommonJS exports', () => {
    assert.equal( typeof ChemParse, 'function' );
    assert.equal( typeof ChemParse.parse, 'function' );
    assert.equal( typeof parse, 'function' );
    assert.equal( typeof validate, 'function' );
    assert.equal( typeof compare, 'function' );
    assert.equal( typeof compareMany, 'function' );
    assert.equal( typeof diff, 'function' );
    assert.equal( typeof diffMany, 'function' );
  } );

  await t.test( 'ESM exports', async () => {
    const module = await import( '../dist/chemparse.mjs' );

    assert.equal( typeof module.default, 'function' );
    assert.equal( typeof module.parse, 'function' );
    assert.equal( typeof module.validate, 'function' );
    assert.equal( typeof module.compare, 'function' );
    assert.equal( typeof module.compareMany, 'function' );
    assert.equal( typeof module.diff, 'function' );
    assert.equal( typeof module.diffMany, 'function' );
    assert.ok( Array.isArray( module.ELEMENT_SYMBOLS ) );
  } );

  await t.test( 'element symbols are immutable', () => {
    assert.ok( Object.isFrozen( ELEMENT_SYMBOLS ) );
    assert.equal( ChemParse.ELEMENT_SYMBOLS, ELEMENT_SYMBOLS );
    assert.equal( ELEMENT_SYMBOLS.length, 118 );
  } );
} );


test( 'parse', async t => {
  await t.test( 'simple formulas', () => {
    assert.deepEqual( parse( 'H2O' ), { elementCounts: { H: 2, O: 1 } } );
    assert.deepEqual( parse( 'NaCl' ), { elementCounts: { Na: 1, Cl: 1 } } );
    assert.deepEqual( parse( 'C6H12O6' ), { elementCounts: { H: 12, C: 6, O: 6 } } );
  } );

  await t.test( 'all IUPAC element symbols', () => {
    assert.equal( ELEMENT_SYMBOLS.length, 118 );

    for ( const symbol of ELEMENT_SYMBOLS )
      assert.deepEqual( parse( symbol ), { elementCounts: { [ symbol ]: 1 } } );
  } );

  await t.test( 'parentheses and groups', () => {
    assert.deepEqual( parse( 'Ca(OH)2' ), { elementCounts: { H: 2, O: 2, Ca: 1 } } );
    assert.deepEqual( parse( '(NH4)2SO4' ), { elementCounts: { H: 8, N: 2, O: 4, S: 1 } } );
    assert.deepEqual( parse( 'Al2(SO4)3' ), { elementCounts: { O: 12, Al: 2, S: 3 } } );
  } );

  await t.test( 'nested groups and brackets', () => {
    assert.deepEqual( parse( 'K4[Fe(CN)6]' ), { elementCounts: { C: 6, N: 6, K: 4, Fe: 1 } } );
    assert.deepEqual( parse( 'Ca3[Co(OH)6]2' ), { elementCounts: { H: 12, O: 12, Ca: 3, Co: 2 } } );
    assert.deepEqual( parse( '{[H2O]2}3' ), { elementCounts: { H: 12, O: 6 } } );
  } );

  await t.test( 'comma-separated elements in groups', () => {
    assert.deepEqual( parse( 'Fe2(S,O4)' ), { elementCounts: { O: 4, S: 1, Fe: 2 } } );
    assert.deepEqual( parse( 'Al2(S,O4)3' ), { elementCounts: { O: 12, Al: 2, S: 3 } } );
    assert.deepEqual( parse( 'Fe(S,(O))' ), { elementCounts: { O: 1, S: 1, Fe: 1 } } );
  } );

  await t.test( 'hydrates and separators', () => {
    assert.deepEqual( parse( 'CuSO4·5H2O' ), { elementCounts: { H: 10, O: 9, S: 1, Cu: 1 } } );
    assert.deepEqual( parse( 'CCl3_CH(OH)2' ), { elementCounts: { H: 3, C: 2, O: 2, Cl: 3 } } );
  } );

  await t.test( 'leading coefficients', () => {
    assert.deepEqual( parse( '2H2O' ), { elementCounts: { H: 4, O: 2 } } );
    assert.deepEqual( parse( '5·H2O' ), { elementCounts: { H: 10, O: 5 } } );
    assert.deepEqual( parse( '2·3H2O' ), { elementCounts: { H: 12, O: 6 } } );
    assert.deepEqual( parse( '2H2O·3NaCl' ), { elementCounts: { H: 4, O: 2, Na: 3, Cl: 3 } } );
  } );

  await t.test( 'decimal notation', () => {
    assert.deepEqual( parse( 'C1.5O3' ), { elementCounts: { C: 1.5, O: 3 } } );
    assert.deepEqual( parse( 'Mg(OH)1.5' ), { elementCounts: { H: 1.5, O: 1.5, Mg: 1 } } );
    assert.deepEqual( parse( 'Fe2(SO4)1.5' ), { elementCounts: { O: 6, S: 1.5, Fe: 2 } } );
    assert.deepEqual( parse( 'C1,5O3' ), { elementCounts: { C: 1.5, O: 3 } } );
    assert.deepEqual( parse( '.5H2O' ), { elementCounts: { H: 1, O: 0.5 } } );
  } );

  await t.test( 'scientific notation', () => {
    assert.deepEqual( parse( 'H2e-1O1e-1' ), { elementCounts: { H: 0.2, O: 0.1 } } );
    assert.deepEqual( parse( 'C1e2O2.5e-1' ), { elementCounts: { C: 100, O: 0.25 } } );
  } );

  await t.test( 'whitespace normalization', () => {
    assert.deepEqual( parse( ' H 2 O ' ), { elementCounts: { H: 2, O: 1 } } );
    assert.deepEqual( parse( ' Ca ( OH ) 2 ' ), { elementCounts: { H: 2, O: 2, Ca: 1 } } );
  } );

  await t.test( 'ionic charges', () => {
    assert.deepEqual( parse( 'SO4^2-' ), { elementCounts: { O: 4, S: 1 }, charge: -2 } );
    assert.deepEqual( parse( 'NH4^+' ), { elementCounts: { H: 4, N: 1 }, charge: 1 } );
    assert.deepEqual( parse( 'CH3COO^-' ), { elementCounts: { H: 3, C: 2, O: 2 }, charge: -1 } );
    assert.deepEqual( parse( 'Fe(CN)6^3-' ), { elementCounts: { C: 6, N: 6, Fe: 1 }, charge: -3 } );
  } );

  await t.test( 'alternative charge notation', () => {
    assert.deepEqual( parse( 'SO4^-2' ), { elementCounts: { O: 4, S: 1 }, charge: -2 } );
    assert.deepEqual( parse( 'SO4^+2' ), { elementCounts: { O: 4, S: 1 }, charge: 2 } );
    assert.deepEqual( parse( 'SO4²⁻' ), { elementCounts: { O: 4, S: 1 }, charge: -2 } );
    assert.deepEqual( parse( 'NH4⁺' ), { elementCounts: { H: 4, N: 1 }, charge: 1 } );
  } );

  await t.test( 'invalid formulas', () => {
    const invalid = [
      '', ' ', '5', 'H0', 'H-1', 'H1e999', 'H1e308H1e308', 'Xx', 'Foo', 'H2O!', 'H^2', 'H^0+',
      'H^999999999999999999999+', '()', '[]', '{}', 'H()', 'H[]', 'H{}', 'C([O})', 'C((O)', 'C(O))',
      'Fe(,S)', 'Fe(S,)', 'Fe(S,,O)', 'Fe(,,S)', 'H,O', 'H2O·', '·H2O', 'H2O__NaCl', 'H2O·5'
    ];

    for ( const formula of invalid ) assert.throws( () => parse( formula ), undefined, formula );
  } );

  await t.test( 'invalid argument types', () => {
    assert.throws( () => parse( null ), TypeError );
    assert.throws( () => parse( undefined ), TypeError );
    assert.throws( () => parse( 123 ), TypeError );
    assert.throws( () => parse( {} ), TypeError );
  } );
} );


test( 'particles', async t => {
  await t.test( 'particle symbols and charges', () => {
    assert.deepEqual( parse( 'e-' ), { elementCounts: {}, particleCounts: { e: 1 }, charge: -1 } );
    assert.deepEqual( parse( 'e+' ), { elementCounts: {}, particleCounts: { e: 1 }, charge: 1 } );
    assert.deepEqual( parse( 'p+' ), { elementCounts: {}, particleCounts: { p: 1 }, charge: 1 } );
    assert.deepEqual( parse( 'n' ), { elementCounts: {}, particleCounts: { n: 1 } } );
    assert.deepEqual( parse( 'α' ), { elementCounts: {}, particleCounts: { α: 1 }, charge: 2 } );
    assert.deepEqual( parse( 'β-' ), { elementCounts: {}, particleCounts: { β: 1 }, charge: -1 } );
    assert.deepEqual( parse( 'β+' ), { elementCounts: {}, particleCounts: { β: 1 }, charge: 1 } );
    assert.deepEqual( parse( 'γ' ), { elementCounts: {}, particleCounts: { γ: 1 } } );
    assert.deepEqual( parse( 'ν' ), { elementCounts: {}, particleCounts: { ν: 1 } } );
    assert.deepEqual( parse( 'ν̄' ), { elementCounts: {}, particleCounts: { 'ν̄': 1 } } );
  } );

  await t.test( 'particle coefficients', () => {
    assert.deepEqual( parse( '2e-' ), { elementCounts: {}, particleCounts: { e: 2 }, charge: -1 } );
    assert.deepEqual( parse( '3α' ), { elementCounts: {}, particleCounts: { α: 3 }, charge: 2 } );
  } );

  await t.test( 'particle validation', () => {
    for ( const particle of [ 'e-', 'e+', 'p+', 'n', 'α', 'β-', 'β+', 'γ', 'ν', 'ν̄' ] )
      assert.equal( validate( particle ), true );
  } );

  await t.test( 'particle comparison', () => {
    assert.equal( compare( 'e-', 'e-' ), true );
    assert.equal( compare( 'e-', 'e+' ), false );
    assert.equal( compare( 'e-', 'β-' ), false );
    assert.equal( compare( 'α', 'α' ), true );
    assert.equal( compareMany( 'γ', 'γ', 'γ' ), true );
  } );

  await t.test( 'particle differences', () => {
    assert.deepEqual( diff( 'α', 'n' ), { elementCounts: {}, particleCounts: { n: -1, α: 1 }, charge: 2 } );
  } );
} );


test( 'validate', () => {
  assert.equal( validate( 'H2O' ), true );
  assert.equal( validate( 'CuSO4·5H2O' ), true );
  assert.equal( validate( 'Fe2(S,O4)' ), true );
  assert.equal( validate( 'SO4^2-' ), true );

  assert.equal( validate( '' ), false );
  assert.equal( validate( 'H0' ), false );
  assert.equal( validate( 'Xx' ), false );
  assert.equal( validate( 'Fe(,S)' ), false );
  assert.equal( validate( 'H2O·5' ), false );
  assert.equal( validate( null ), false );
} );


test( 'compare', async t => {
  await t.test( 'equivalent formulas', () => {
    assert.equal( compare( 'H2O', 'OH2' ), true );
    assert.equal( compare( 'Ca(OH)2', 'CaH2O2' ), true );
    assert.equal( compare( 'Al2(SO4)3', 'Al2S3O12' ), true );
    assert.equal( compare( 'CuSO4·5H2O', 'CuH10O9S' ), true );
  } );

  await t.test( 'different formulas', () => {
    assert.equal( compare( 'H2O', 'H2' ), false );
    assert.equal( compare( 'NaCl', 'KCl' ), false );
    assert.equal( compare( 'NH4^+', 'NH4^-' ), false );
  } );

  await t.test( 'compareMany', () => {
    assert.equal( compareMany( 'H2O', 'OH2', 'H2O' ), true );
    assert.equal( compareMany( 'H2O', 'OH2', 'H2' ), false );
    assert.equal( compareMany( 'NaCl', 'ClNa', 'NaCl' ), true );
  } );

  await t.test( 'requires at least two formulas', () => {
    assert.throws( () => compareMany() );
    assert.throws( () => compareMany( 'H2O' ) );
  } );

  await t.test( 'invalid formulas throw', () => {
    assert.throws( () => compare( 'H2O', 'Xx' ) );
  } );
} );


test( 'diff', async t => {
  await t.test( 'element count differences', () => {
    assert.deepEqual( diff( 'C6H12O6', 'C1.5O3' ), { elementCounts: { H: 12, C: 4.5, O: 3 } } );
    assert.deepEqual( diff( 'H2O', 'H2' ), { elementCounts: { H: 0, O: 1 } } );
    assert.deepEqual( diff( 'NaCl', 'KCl' ), { elementCounts: { Na: 1, K: -1, Cl: 0 } } );
  } );

  await t.test( 'charge differences', () => {
    assert.deepEqual( diff( 'Na^+', 'Cl^-' ), { elementCounts: { Na: 1, Cl: -1 }, charge: 2 } );
    assert.deepEqual( diff( 'SO4^2-', 'SO4^-' ), { elementCounts: { O: 0, S: 0 }, charge: -1 } );
  } );

  await t.test( 'diffMany', () => {
    assert.deepEqual( diffMany( 'H2O', 'H2', 'O2' ), [
      { formula: 'H2', elementCounts: { H: 0, O: 1 } },
      { formula: 'O2', elementCounts: { H: 2, O: -1 } }
    ] );
  } );

  await t.test( 'diffMany includes charge differences', () => {
    assert.deepEqual( diffMany( 'Na^+', 'Cl^-', 'Na^-' ), [
      { formula: 'Cl^-', elementCounts: { Na: 1, Cl: -1 }, charge: 2 },
      { formula: 'Na^-', elementCounts: { Na: 0 }, charge: 2 }
    ] );
  } );

  await t.test( 'requires at least two formulas', () => {
    assert.throws( () => diffMany() );
    assert.throws( () => diffMany( 'H2O' ) );
  } );

  await t.test( 'invalid formulas throw', () => {
    assert.throws( () => diff( 'H2O', 'Xx' ) );
    assert.throws( () => diffMany( 'H2O', 'Xx' ) );
  } );
} );


test( 'class API', () => {
  assert.deepEqual( ChemParse.parse( 'H2O' ), parse( 'H2O' ) );
  assert.equal( ChemParse.validate( 'H2O' ), validate( 'H2O' ) );
  assert.equal( ChemParse.compare( 'H2O', 'OH2' ), compare( 'H2O', 'OH2' ) );
  assert.equal( ChemParse.compareMany( 'H2O', 'OH2' ), compareMany( 'H2O', 'OH2' ) );
  assert.deepEqual( ChemParse.diff( 'H2O', 'H2' ), diff( 'H2O', 'H2' ) );
  assert.deepEqual( ChemParse.diffMany( 'H2O', 'H2' ), diffMany( 'H2O', 'H2' ) );
} );
