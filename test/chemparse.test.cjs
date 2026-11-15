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
} );
