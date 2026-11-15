# ChemParse

**ChemParse** is a lightweight TypeScript library for parsing and comparing chemical formulas.

It supports all 118 IUPAC element symbols, nested groups, decimal and scientific notation, hydrate notation,
leading coefficients, element lists, and ionic charges.

## Features

- Parses chemical formulas into element counts
- Supports all 118 IUPAC element symbols
- Handles nested parentheses, square brackets, and curly brackets
- Supports decimal and scientific notation
- Parses dot-separated and underscore-separated hydrate parts
- Supports leading coefficients and hydrate multipliers
- Accepts comma-separated element lists inside groups
- Recognizes ionic charges in caret and Unicode superscript notation
- Compares multiple formulas by composition and charge
- Calculates element count and charge differences
- Provides TypeScript types and both named and default exports
- Uses an iterative parser to handle nested groups
