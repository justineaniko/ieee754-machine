/**
 * Converts a decimal number to its IEEE 754 32-bit single-precision format.
 * 
 * @param {number|string} input - The decimal value to convert
 * @returns {Object} An object containing the binary parts, hex representation, and classification.
 */
function convertDecimal(input) {
    // Parse input to a number. If it's already a number, it stays as number
    const value = typeof input === 'string' ? parseFloat(input) : input;

    // Checks for invalid input
    if (isNaN(value) && input !== 'NaN' && typeof input !== 'number') {
        throw new Error("Invalid numeric input");
    }

    // Use a shared memory buffer to interpret the 32-bit float representation as an unsigned integer.
    const buffer = new ArrayBuffer(4);
    const floatView = new Float32Array(buffer);
    const uintView = new Uint32Array(buffer);

    floatView[0] = value; // Write float representation to the buffer
    const bits = uintView[0]; // Read those 32 bits as an integer

    // Extract components using bitwise shifts and masks
    const sign = (bits >>> 31) & 1;
    const exponent = (bits >>> 23) & 0xFF;
    const mantissa = bits & 0x7FFFFF;

    // Helper for padding binary/hex representations with zeros
    const pad = (str, targetLength) => str.padStart(targetLength, '0');

    // Format representations
    const signStr = sign.toString(2);
    const exponentStr = pad(exponent.toString(2), 8);
    const mantissaStr = pad(mantissa.toString(2), 23);
    const hexStr = "0x" + pad(bits.toString(16).toUpperCase(), 8);

    // Determine classification
    let classification = "Normalized Number";
    if (Number.isNaN(value)) {
        classification = "NaN (Not a Number)";
    } else if (value === Infinity) {
        classification = "+Infinity";
    } else if (value === -Infinity) {
        classification = "-Infinity";
    } else if (value === 0) {
        classification = (sign === 1) ? "Negative Zero (-0.0)" : "Positive Zero (+0.0)";
    } else if (exponent === 0 && mantissa !== 0) {
        classification = "Subnormal / Denormalized Number";
    }

    // Return structured data
    return {
        originalValue: floatView[0], // Float32 rounded version of input
        classification: classification,
        sign: sign,
        exponent: exponent,
        mantissa: mantissa,
        binary: {
            sign: signStr,
            exponent: exponentStr,
            mantissa: mantissaStr,
            spaced: `${signStr} ${exponentStr} ${mantissaStr}`
        },
        hex: hexStr
    };
}