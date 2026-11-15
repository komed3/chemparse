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
