'use strict';


const assert = require( 'node:assert/strict' );
const test = require( 'node:test' );

const ChemParse = require( '../dist/chemparse.cjs' ).default;
const { parse, validate, compare, compareMany, diff, diffMany } = require( '../dist/chemparse.cjs' );


test( 'exports', () => {
  assert.equal( typeof ChemParse.parse, 'function' );
  assert.equal( typeof parse, 'function' );
  assert.equal( typeof validate, 'function' );
  assert.equal( typeof compare, 'function' );
  assert.equal( typeof compareMany, 'function' );
  assert.equal( typeof diff, 'function' );
  assert.equal( typeof diffMany, 'function' );
} );
