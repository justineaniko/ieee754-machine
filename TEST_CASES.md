# IEEE 754 Machine Test-Case Matrix

This matrix covers the normal, special, and edge cases required for the Binary 32-bit Floating-Point Machine. All expected binary results use the spacing `sign exponent mantissa`.

## How to record results

1. Run every case using the web application.
2. Copy the displayed result into the **Actual output** column.
3. Replace `Pending` with `Pass` if the actual result exactly matches the expected result. Otherwise, write `Fail` and briefly describe the difference.
4. Save a screenshot for each test or one screenshot that clearly shows several related tests.

## Feature 1: Decimal to IEEE 754 single precision

| ID | Category | Decimal input | Expected binary | Expected hexadecimal | Expected classification | Actual output | Status |
|---|---|---:|---|---|---|---|---|
| C01 | Normal positive | `12.375` | `0 10000010 10001100000000000000000` | `0x41460000` | Normalized number | `0 10000010 10001100000000000000000`; `0x41460000`; Normalized Number | Pass |
| C02 | Normal negative | `-2.5` | `1 10000000 01000000000000000000000` | `0xC0200000` | Normalized number | `1 10000000 01000000000000000000000`; `0xC0200000`; Normalized Number | Pass |
| C03 | Special | `0` | `0 00000000 00000000000000000000000` | `0x00000000` | Positive zero | `0 00000000 00000000000000000000000`; `0x00000000`; Positive Zero (+0.0) | Pass |
| C04 | Special | `-0` | `1 00000000 00000000000000000000000` | `0x80000000` | Negative zero | `1 00000000 00000000000000000000000`; `0x80000000`; Negative Zero (-0.0) | Pass |
| C05 | Edge | `1.40129846e-45` | `0 00000000 00000000000000000000001` | `0x00000001` | Smallest positive subnormal | `0 00000000 00000000000000000000001`; `0x00000001`; Denormalized Number | Pass |
| C06 | Edge | `1.1754942106924411e-38` | `0 00000000 11111111111111111111111` | `0x007FFFFF` | Largest positive subnormal | `0 00000000 11111111111111111111111`; `0x007FFFFF`; Denormalized Number | Pass |
| C07 | Edge | `1.1754943508222875e-38` | `0 00000001 00000000000000000000000` | `0x00800000` | Smallest positive normal | `0 00000001 00000000000000000000000`; `0x00800000`; Normalized Number | Pass |
| C08 | Edge | `3.4028234663852886e38` | `0 11111110 11111111111111111111111` | `0x7F7FFFFF` | Maximum positive finite value | `0 11111110 11111111111111111111111`; `0x7F7FFFFF`; Normalized Number | Pass |
| C09 | Edge/overflow | `3.5e38` | `0 11111111 00000000000000000000000` | `0x7F800000` | Positive infinity | `0 11111111 00000000000000000000000`; `0x7F800000`; +Infinity | Pass |
| C10 | Special | `Infinity` | `0 11111111 00000000000000000000000` | `0x7F800000` | Positive infinity | Not accepted by the conversion form input | Fail |
| C11 | Special | `-Infinity` | `1 11111111 00000000000000000000000` | `0xFF800000` | Negative infinity | Not accepted by the conversion form input | Fail |
| C12 | Special | `NaN` | `0 11111111 10000000000000000000000` | `0x7FC00000` | NaN | Not accepted by the form; converter reports `Invalid numeric input` | Fail |

> `0x7FC00000` is the canonical quiet-NaN representation used by this project. Other nonzero mantissas with an exponent of all ones are also valid NaN encodings.

## Feature 2: Rounding methods

The target is the number of mantissa bits kept after the leading `1`. Each row checks chopping, round-up toward positive infinity, round-down toward negative infinity, and round-to-nearest ties-to-even.

| ID | Category/purpose | Input | Format | Target bits | Expected chop | Expected round-up | Expected round-down | Expected nearest-even | Actual output | Status |
|---|---|---|---|---:|---|---|---|---|---|---|
| R01 | Normal positive, above halfway | `1.1011` | Binary | 2 | `1.10 x 2^0 (= 1.5)` | `1.11 x 2^0 (= 1.75)` | `1.10 x 2^0 (= 1.5)` | `1.11 x 2^0 (= 1.75)` | Chop `1.10 x 2^0 (= 1.5)`; Up `1.11 x 2^0 (= 1.75)`; Down `1.10 x 2^0 (= 1.5)`; Nearest `1.11 x 2^0 (= 1.75)` | Pass |
| R02 | Normal negative, directed rounding | `-1.1011` | Binary | 2 | `-1.10 x 2^0 (= -1.5)` | `-1.10 x 2^0 (= -1.5)` | `-1.11 x 2^0 (= -1.75)` | `-1.11 x 2^0 (= -1.75)` | Chop `-1.10 x 2^0 (= -1.5)`; Up `-1.10 x 2^0 (= -1.5)`; Down `-1.11 x 2^0 (= -1.75)`; Nearest `-1.11 x 2^0 (= -1.75)` | Pass |
| R03 | Exact tie, kept bit even | `1.101` | Binary | 2 | `1.10 x 2^0 (= 1.5)` | `1.11 x 2^0 (= 1.75)` | `1.10 x 2^0 (= 1.5)` | `1.10 x 2^0 (= 1.5)` | Chop `1.10 x 2^0 (= 1.5)`; Up `1.11 x 2^0 (= 1.75)`; Down `1.10 x 2^0 (= 1.5)`; Nearest `1.10 x 2^0 (= 1.5)` | Pass |
| R04 | Exact tie, kept bit odd | `1.111` | Binary | 2 | `1.11 x 2^0 (= 1.75)` | `1.00 x 2^1 (= 2)` | `1.11 x 2^0 (= 1.75)` | `1.00 x 2^1 (= 2)` | Chop `1.11 x 2^0 (= 1.75)`; Up `1.00 x 2^1 (= 2)`; Down `1.11 x 2^0 (= 1.75)`; Nearest `1.00 x 2^1 (= 2)` | Pass |
| R05 | Exact value, no discarded bits | `1.01` | Binary | 2 | `1.01 x 2^0 (= 1.25)` | `1.01 x 2^0 (= 1.25)` | `1.01 x 2^0 (= 1.25)` | `1.01 x 2^0 (= 1.25)` | All four methods: `1.01 x 2^0 (= 1.25)` | Pass |
| R06 | Decimal input, below halfway | `10.5` | Decimal | 2 | `1.01 x 2^3 (= 10)` | `1.10 x 2^3 (= 12)` | `1.01 x 2^3 (= 10)` | `1.01 x 2^3 (= 10)` | Chop `1.01 x 2^3 (= 10)`; Up `1.10 x 2^3 (= 12)`; Down `1.01 x 2^3 (= 10)`; Nearest `1.01 x 2^3 (= 10)` | Pass |
| R07 | Repeating binary fraction | `0.1` | Decimal | 3 | `1.100 x 2^-4 (= 0.09375)` | `1.101 x 2^-4 (= 0.1015625)` | `1.100 x 2^-4 (= 0.09375)` | `1.101 x 2^-4 (= 0.1015625)` | Chop `1.100 x 2^-4 (= 0.09375)`; Up `1.101 x 2^-4 (= 0.1015625)`; Down `1.100 x 2^-4 (= 0.09375)`; Nearest `1.101 x 2^-4 (= 0.1015625)` | Pass |
| R08 | Special zero | `0` | Decimal | 3 | `0` | `0` | `0` | `0` | All four methods: `0` | Pass |

## Feature 3: IEEE 754 addition and multiplication

For every arithmetic test, verify the step-by-step solution in addition to the three final output formats.

| ID | Category/purpose | Operand A | Operand B | Operation | Expected binary | Expected hexadecimal | Expected decimal | Steps shown? | Actual output | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| A01 | Normal addition | `1.5` | `2.25` | Add | `0 10000000 11100000000000000000000` | `0x40700000` | `3.75` | Yes | `0 10000000 11100000000000000000000`; `0x40700000`; `3.75` | Pass |
| A02 | Normal multiplication | `1.5` | `2.25` | Multiply | `0 10000000 10110000000000000000000` | `0x40580000` | `3.375` | Yes | `0 10000000 10110000000000000000000`; `0x40580000`; `3.375` | Pass |
| A03 | Negative result | `-2` | `3` | Multiply | `1 10000001 10000000000000000000000` | `0xC0C00000` | `-6` | Yes | `1 10000001 10000000000000000000000`; `0xC0C00000`; `-6` | Pass |
| A04 | Exact cancellation | `1` | `-1` | Add | `0 00000000 00000000000000000000000` | `0x00000000` | `0` | Yes | `0 00000000 00000000000000000000000`; `0x00000000`; `0` | Pass |
| A05 | Special infinity cancellation | `Infinity` | `-Infinity` | Add | `0 11111111 10000000000000000000000` | `0x7FC00000` | `NaN` | Yes | `0 11111111 10000000000000000000000`; `0x7FC00000`; `NaN` | Pass |
| A06 | Special invalid multiplication | `Infinity` | `0` | Multiply | `0 11111111 10000000000000000000000` | `0x7FC00000` | `NaN` | Yes | `0 11111111 10000000000000000000000`; `0x7FC00000`; `NaN` | Pass |
| A07 | Special NaN propagation | `NaN` | `1` | Add | `0 11111111 10000000000000000000000` | `0x7FC00000` | `NaN` | Yes | `0 11111111 10000000000000000000000`; `0x7FC00000`; `NaN` | Pass |
| A08 | Signed infinity | `-Infinity` | `2` | Multiply | `1 11111111 00000000000000000000000` | `0xFF800000` | `-Infinity` | Yes | `1 11111111 00000000000000000000000`; `0xFF800000`; `-Infinity` | Pass |
| A09 | Overflow | `3.4028234663852886e38` | `3.4028234663852886e38` | Add | `0 11111111 00000000000000000000000` | `0x7F800000` | `+Infinity` | Yes | `0 11111111 00000000000000000000000`; `0x7F800000`; `+Infinity` | Pass |
| A10 | Underflow to zero | `1.40129846e-45` | `0.5` | Multiply | `0 00000000 00000000000000000000000` | `0x00000000` | `0` | Yes | `0 00000000 00000000000000000000000`; `0x00000000`; `0` | Pass |
| A11 | IEEE hexadecimal inputs | `0x3F800000` | `0x40000000` | Add | `0 10000000 10000000000000000000000` | `0x40400000` | `3` | Yes | `0 10000000 10000000000000000000000`; `0x40400000`; `3` | Pass |
| A12 | Signed zero | `0` | `-3` | Multiply | `1 00000000 00000000000000000000000` | `0x80000000` | `-0` | Yes | `1 00000000 00000000000000000000000`; `0x80000000`; `-0` | Pass |
| A13 | Normal/subnormal boundary | `1.1754943508222875e-38` | `-1.1754942106924411e-38` | Add | `0 00000000 00000000000000000000001` | `0x00000001` | `1.401298464324817e-45` | Yes | `0 00000000 00000000000000000000001`; `0x00000001`; displayed `1.401298e-45` | Fail |
| A14 | Subnormal arithmetic using hex | `0x00000001` | `0x00000001` | Add | `0 00000000 00000000000000000000010` | `0x00000002` | `2.802596928649634e-45` | Yes | `0 00000000 00000000000000000000010`; `0x00000002`; displayed `2.802597e-45` | Fail |
| A15 | Maximum finite value retained | `0x7F7FFFFF` | `0x3F800000` | Multiply | `0 11111110 11111111111111111111111` | `0x7F7FFFFF` | `3.4028234663852886e+38` | Yes | `0 11111110 11111111111111111111111`; `0x7F7FFFFF`; `3.4028234663852886e+38` | Pass |

## Test execution notes

- Tested on August 2, 2026 against the JavaScript currently served by the [live GitHub Pages deployment](https://justineaniko.github.io/ieee754-machine/).
- `C10` to `C12` fail at the conversion UI because its HTML input is `type="number"`, which does not accept `Infinity`, `-Infinity`, or `NaN`.
- All eight rounding calculations match the expected values. The page still logs `ReferenceError: binaryRadio is not defined` whenever the rounding input changes, although the **Round** button continues to calculate correctly.
- `A13` and `A14` have the correct IEEE binary and hexadecimal results, but the displayed decimal values are shortened in scientific notation, so they fail the matrix's exact-output comparison.
- Every arithmetic case displayed a step-by-step solution.

## Completion summary

| Feature | Total tests | Passed | Failed | Pending |
|---|---:|---:|---:|---:|
| Decimal conversion | 12 | 9 | 3 | 0 |
| Rounding | 8 | 8 | 0 | 0 |
| Arithmetic | 15 | 13 | 2 | 0 |
| **Overall** | **35** | **30** | **5** | **0** |

Retest the five failed cases after the listed issues are fixed.
