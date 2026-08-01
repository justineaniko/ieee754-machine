document.addEventListener("DOMContentLoaded", () => {
    const decimalInput = document.getElementById("decimal-input");
    const convertBtn = document.getElementById("convert-btn");

    const signOutput = document.getElementById("sign-output");
    const exponentOutput = document.getElementById("exponent-output");
    const mantissaOutput = document.getElementById("mantissa-output");
    const binaryOutput = document.getElementById("binary-output");
    const hexOutput = document.getElementById("hex-output");

    convertBtn.addEventListener("click", () => {
        const rawValue = decimalInput.value.trim();

        if (rawValue === "") {
            alert("Please enter a decimal number first.");
            return;
        }

        try {
            // Convert the value 
            const result = convertDecimalToIEEE754(rawValue);

            // Update the UI elements
            signOutput.textContent = result.sign;
            exponentOutput.textContent = result.binary.exponent;
            mantissaOutput.textContent = result.binary.mantissa;
            binaryOutput.textContent = result.binary.spaced;

            // Display classification next to Hex output IF it is a special case
            if (result.classification !== "Normalized Number") {
                hexOutput.textContent = `${result.hex} (${result.classification})`;
            } else {
                hexOutput.textContent = result.hex;
            }

        } catch (error) {
            alert("Error during conversion: " + error.message);
        }
    });
});

/**
 * Converts a decimal number to its IEEE 754 32-bit single-precision format.
 * Detects special cases by analyzing the resulting exponents and mantissas.
 */
export function convertDecimalToIEEE754(input) {
    // Parse input to standard float
    const value = parseFloat(input);

    if (isNaN(value)) {
        throw new Error("Invalid numeric input");
    }

    // Allocate 4 bytes of memory to view it as a 32-bit float
    const buffer = new ArrayBuffer(4);
    const floatView = new Float32Array(buffer);
    const uintView = new Uint32Array(buffer);

    // Assign a value. If the input exceeds float32 ranges, 
    // JavaScript already automatically handles the overflow (Infinity) or underflow (Denormalized/0).
    floatView[0] = value;
    const bits = uintView[0];

    // bitwise shifts and masks
    const sign = (bits >>> 31) & 1;
    const exponent = (bits >>> 23) & 0xFF;
    const mantissa = bits & 0x7FFFFF;

    // Determines specific IEEE 754 classification based on specifications
    let classification = "Normalized Number";

    if (exponent === 0xFF) {
        if (mantissa === 0) {
            classification = (sign === 1) ? "-Infinity" : "+Infinity";
        } else {
            classification = "NaN (Not a Number)";
        }
    } else if (exponent === 0) {
        if (mantissa === 0) {
            classification = (sign === 1) ? "Negative Zero (-0.0)" : "Positive Zero (+0.0)";
        } else {
            classification = "Denormalized Number";
        }
    }

    // Helper function for padding binary structures
    const pad = (str, targetLength) => str.padStart(targetLength, '0');

    const signStr = sign.toString();
    const exponentStr = pad(exponent.toString(2), 8);
    const mantissaStr = pad(mantissa.toString(2), 23);
    const hexStr = "0x" + pad(bits.toString(16).toUpperCase(), 8);

    return {
        sign: signStr,
        classification: classification,
        binary: {
            exponent: exponentStr,
            mantissa: mantissaStr,
            spaced: `${signStr} ${exponentStr} ${mantissaStr}`
        },
        hex: hexStr
    };
}