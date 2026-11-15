'use strict';


const assert = require( 'node:assert/strict' );
const test = require( 'node:test' );

const ChemParse = require( '../dist/chemparse.cjs' ).default;
const { parse, validate, compare, diff } = require( '../dist/chemparse.cjs' );
