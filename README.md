# IEEE-754 Converter
case study 1, csarch2

# BitByBit: IEEE 754 Binary 32-bit Floating-Point Machine

BitByBit is a web-based simulator for IEEE 754 binary single-precision numbers. It was developed for the CSARCH2 Simulation Project under **Machine 2: Binary 32-bit Floating-Point Machine**.

The application demonstrates how a 32-bit floating-point value is represented and processed through three main features:

1. Decimal-to-IEEE 754 conversion
2. Binary floating-point rounding
3. IEEE 754 addition and multiplication

## Project links

- **Live website:** _Add deployment link here_
- **Video walkthrough:** _Add the 5â€“8 minute YouTube link here_
- **Complete test-case matrix:** [TEST_CASES.md](TEST_CASES.md)
- **Screenshots:** _Add the `screenshots/` folder link after capturing the final outputs_

## Features

### 1. Decimal to IEEE 754 conversion

The converter accepts a decimal value and displays its IEEE 754 binary32 representation as:

- 1-bit sign field
- 8-bit biased exponent field
- 23-bit fraction or mantissa field
- Complete binary value with proper spacing
- 8-digit hexadecimal value

It also classifies zero, subnormal values, normalized values, infinity, and NaN based on the exponent and fraction fields.

### 2. Rounding methods

The rounding feature accepts a decimal or binary number and a target number of mantissa bits. It displays the result of all four required methods:

- Chopping or truncation
- Round up, toward positive infinity
- Round down, toward negative infinity
- Round to nearest, ties to even

The implementation checks the discarded portion using the guard bit and sticky bit. For a halfway case, ties-to-even keeps the result when the last retained bit is even and increments it when the last retained bit is odd.

### 3. IEEE 754 arithmetic

The arithmetic feature accepts two operands in either decimal form or 8-digit IEEE 754 hexadecimal form. It supports:

- Addition
- Multiplication

For each operation, the application shows the decoded operands, the main arithmetic steps, normalization, round-to-nearest ties-to-even, and the final result in:

- Binary with `sign exponent mantissa` spacing
- Hexadecimal
- Decimal

Special cases such as NaN, infinity, signed zero, overflow, underflow, and subnormal results are also handled.
