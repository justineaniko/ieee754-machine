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
| C01 | Normal positive | `12.375` | `0 10000010 10001100000000000000000` | `0x41460000` | Normalized number |  | Pending |
| C02 | Normal negative | `-2.5` | `1 10000000 01000000000000000000000` | `0xC0200000` | Normalized number |  | Pending |
| C03 | Special | `0` | `0 00000000 00000000000000000000000` | `0x00000000` | Positive zero |  | Pending |
| C04 | Special | `-0` | `1 00000000 00000000000000000000000` | `0x80000000` | Negative zero |  | Pending |
| C05 | Edge | `1.40129846e-45` | `0 00000000 00000000000000000000001` | `0x00000001` | Smallest positive subnormal |  | Pending |
| C06 | Edge | `1.1754942106924411e-38` | `0 00000000 11111111111111111111111` | `0x007FFFFF` | Largest positive subnormal |  | Pending |
| C07 | Edge | `1.1754943508222875e-38` | `0 00000001 00000000000000000000000` | `0x00800000` | Smallest positive normal |  | Pending |
| C08 | Edge | `3.4028234663852886e38` | `0 11111110 11111111111111111111111` | `0x7F7FFFFF` | Maximum positive finite value |  | Pending |
| C09 | Edge/overflow | `3.5e38` | `0 11111111 00000000000000000000000` | `0x7F800000` | Positive infinity |  | Pending |
| C10 | Special | `Infinity` | `0 11111111 00000000000000000000000` | `0x7F800000` | Positive infinity |  | Pending |
| C11 | Special | `-Infinity` | `1 11111111 00000000000000000000000` | `0xFF800000` | Negative infinity |  | Pending |
| C12 | Special | `NaN` | `0 11111111 10000000000000000000000` | `0x7FC00000` | NaN |  | Pending |

> `0x7FC00000` is the canonical quiet-NaN representation used by this project. Other nonzero mantissas with an exponent of all ones are also valid NaN encodings.

## Feature 2: Rounding methods

The target is the number of mantissa bits kept after the leading `1`. Each row checks chopping, round-up toward positive infinity, round-down toward negative infinity, and round-to-nearest ties-to-even.

| ID | Category/purpose | Input | Format | Target bits | Expected chop | Expected round-up | Expected round-down | Expected nearest-even | Actual output | Status |
|---|---|---|---|---:|---|---|---|---|---|---|
| R01 | Normal positive, above halfway | `1.1011` | Binary | 2 | `1.10 x 2^0 (= 1.5)` | `1.11 x 2^0 (= 1.75)` | `1.10 x 2^0 (= 1.5)` | `1.11 x 2^0 (= 1.75)` |  | Pending |
| R02 | Normal negative, directed rounding | `-1.1011` | Binary | 2 | `-1.10 x 2^0 (= -1.5)` | `-1.10 x 2^0 (= -1.5)` | `-1.11 x 2^0 (= -1.75)` | `-1.11 x 2^0 (= -1.75)` |  | Pending |
| R03 | Exact tie, kept bit even | `1.101` | Binary | 2 | `1.10 x 2^0 (= 1.5)` | `1.11 x 2^0 (= 1.75)` | `1.10 x 2^0 (= 1.5)` | `1.10 x 2^0 (= 1.5)` |  | Pending |
| R04 | Exact tie, kept bit odd | `1.111` | Binary | 2 | `1.11 x 2^0 (= 1.75)` | `1.00 x 2^1 (= 2)` | `1.11 x 2^0 (= 1.75)` | `1.00 x 2^1 (= 2)` |  | Pending |
| R05 | Exact value, no discarded bits | `1.01` | Binary | 2 | `1.01 x 2^0 (= 1.25)` | `1.01 x 2^0 (= 1.25)` | `1.01 x 2^0 (= 1.25)` | `1.01 x 2^0 (= 1.25)` |  | Pending |
| R06 | Decimal input, below halfway | `10.5` | Decimal | 2 | `1.01 x 2^3 (= 10)` | `1.10 x 2^3 (= 12)` | `1.01 x 2^3 (= 10)` | `1.01 x 2^3 (= 10)` |  | Pending |
| R07 | Repeating binary fraction | `0.1` | Decimal | 3 | `1.100 x 2^-4 (= 0.09375)` | `1.101 x 2^-4 (= 0.1015625)` | `1.100 x 2^-4 (= 0.09375)` | `1.101 x 2^-4 (= 0.1015625)` |  | Pending |
| R08 | Special zero | `0` | Decimal | 3 | `0` | `0` | `0` | `0` |  | Pending |

## Feature 3: IEEE 754 addition and multiplication

For every arithmetic test, verify the step-by-step solution in addition to the three final output formats.

| ID | Category/purpose | Operand A | Operand B | Operation | Expected binary | Expected hexadecimal | Expected decimal | Steps shown? | Actual output | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| A01 | Normal addition | `1.5` | `2.25` | Add | `0 10000000 11100000000000000000000` | `0x40700000` | `3.75` |  |  | Pending |
| A02 | Normal multiplication | `1.5` | `2.25` | Multiply | `0 10000000 10110000000000000000000` | `0x40580000` | `3.375` |  |  | Pending |
| A03 | Negative result | `-2` | `3` | Multiply | `1 10000001 10000000000000000000000` | `0xC0C00000` | `-6` |  |  | Pending |
| A04 | Exact cancellation | `1` | `-1` | Add | `0 00000000 00000000000000000000000` | `0x00000000` | `0` |  |  | Pending |
| A05 | Special infinity cancellation | `Infinity` | `-Infinity` | Add | `0 11111111 10000000000000000000000` | `0x7FC00000` | `NaN` |  |  | Pending |
| A06 | Special invalid multiplication | `Infinity` | `0` | Multiply | `0 11111111 10000000000000000000000` | `0x7FC00000` | `NaN` |  |  | Pending |
| A07 | Special NaN propagation | `NaN` | `1` | Add | `0 11111111 10000000000000000000000` | `0x7FC00000` | `NaN` |  |  | Pending |
| A08 | Signed infinity | `-Infinity` | `2` | Multiply | `1 11111111 00000000000000000000000` | `0xFF800000` | `-Infinity` |  |  | Pending |
| A09 | Overflow | `3.4028234663852886e38` | `3.4028234663852886e38` | Add | `0 11111111 00000000000000000000000` | `0x7F800000` | `+Infinity` |  |  | Pending |
| A10 | Underflow to zero | `1.40129846e-45` | `0.5` | Multiply | `0 00000000 00000000000000000000000` | `0x00000000` | `0` |  |  | Pending |
| A11 | IEEE hexadecimal inputs | `0x3F800000` | `0x40000000` | Add | `0 10000000 10000000000000000000000` | `0x40400000` | `3` |  |  | Pending |
| A12 | Signed zero | `0` | `-3` | Multiply | `1 00000000 00000000000000000000000` | `0x80000000` | `-0` |  |  | Pending |
| A13 | Normal/subnormal boundary | `1.1754943508222875e-38` | `-1.1754942106924411e-38` | Add | `0 00000000 00000000000000000000001` | `0x00000001` | `1.401298464324817e-45` |  |  | Pending |
| A14 | Subnormal arithmetic using hex | `0x00000001` | `0x00000001` | Add | `0 00000000 00000000000000000000010` | `0x00000002` | `2.802596928649634e-45` |  |  | Pending |
| A15 | Maximum finite value retained | `0x7F7FFFFF` | `0x3F800000` | Multiply | `0 11111110 11111111111111111111111` | `0x7F7FFFFF` | `3.4028234663852886e+38` |  |  | Pending |

## Completion summary

| Feature | Total tests | Passed | Failed | Pending |
|---|---:|---:|---:|---:|
| Decimal conversion | 12 | 0 | 0 | 12 |
| Rounding | 8 | 0 | 0 | 8 |
| Arithmetic | 15 | 0 | 0 | 15 |
| **Overall** | **35** | **0** | **0** | **35** |

Update this summary after testing is complete.
