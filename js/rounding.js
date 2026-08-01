// round mantissa to however many bits the user asks for using four different rounding rules
// two bits after cutoff point for rounding:
// - guard bit: the very next bit after cut off
// - sticky bit: if there's any 1s left after guard bit (sticky = 1, otherwise 0)

document.addEventListener("DOMContentLoaded", () => {
    const roundingInput = document.getElementById("rounding-input");
    const digitsInput = document.getElementById("digits-input");
    const formatRadios = document.getElementsByName("rounding-format"); // decimal or binary
    const roundBtn = document.getElementById("round-btn");

    const chopOutput = document.getElementById("chop");
    const roundUpOutput = document.getElementById("round-up");
    const roundDownOutput = document.getElementById("round-down");
    const roundNearestOutput = document.getElementById("round-nearest");

    roundBtn.addEventListener("click", () => {
        const rawValue = roundingInput.value.trim();
        const digits = parseInt(digitsInput.value, 10);

        if (rawValue === "") {
            alert("Please enter a decimal or binary number first.");
            return;
        }
        if (isNaN(digits) || digits < 0) {
            alert("Please enter a valid number of digits (0 or more).");
            return;
        }

        // checker for which button is selected (decimal or binary)
        let format = "decimal";
        for (const radio of formatRadios) {
            if (radio.checked) format = radio.value;
        }

        try {
            const result = roundNumber(rawValue, format, digits);

            chopOutput.textContent = result.chop;
            roundUpOutput.textContent = result.roundUp;
            roundDownOutput.textContent = result.roundDown;
            roundNearestOutput.textContent = result.nearest;
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
});

function roundNumber(rawValue, format, digits) {

    // parse input into sign, exponent, and mantissa
    let parsed;
    if (format === "binary") {
        parsed = parseBinaryInput(rawValue);
    } else {
        parsed = parseDecimalInput(rawValue);
    }

    // if 0, no need to round
    if (parsed.isZero) {
        return { chop: "0", roundUp: "0", roundDown: "0", nearest: "0" };
    }

    const sign = parsed.sign; // 0 for positive, 1 for negative
    const exponent = parsed.exponent;
    const mantissaBits = parsed.mantissaBits;

    // pad zeroes to check guard/sticky bits
    const bits = mantissaBits.padEnd(digits + 64, "0");

    // split into kept or dropped bits
    const keptBits = bits.substring(0, digits);
    const guardBit = bits.charAt(digits); // dropped bits
    const restOfBits = bits.substring(digits + 1); // everything after guard bit
    const stickyBit = restOfBits.includes("1") ? "1" : "0"; // Sticky = 1 if restOfBits has 1, else 0

    const somethingWasDropped = (guardBit === "1" || stickyBit === "1");

    // BELOW ARE ROUNDING METHOD IMPLEMENTATIONS =====

    // Chop/Truncate: remove extra bits w/o adjusting to round
    const chopBits = { bits: keptBits, carry: false };

    let nearestBits;

    // Round to nearest, ties to even: vvv
    // - if guard bit = 0, chop
    // - if guard bit = 1 & sticky bit = 1, round up
    // - if guard bit = 1 & sticky bit = 0 -> CHECK LAST KEPT BIT if ODD, round up, else (EVEN) chop
    if (guardBit === "0") {
        nearestBits = { bits: keptBits, carry: false };
    } else if (stickyBit === "1") {
        nearestBits = addOneBit(keptBits);
    } else { // for guard bit = 1 & sticky bit = 0 ^^
        const lastKeptBit = digits > 0 ? keptBits.charAt(digits - 1) : "0";
        if (lastKeptBit === "1") {
            // last bit is odd, round up to make it even
            nearestBits = addOneBit(keptBits);
        } else {
            // last bit is already even, leave it
            nearestBits = { bits: keptBits, carry: false };
        }
    }

    // ROUND UP towards +inf: 
    // if positive num, add 1 bit... For binary 1, make 0, left is 1 carry = true
    // if negative num, just chop... For binary 0, keep as 0, left stays 0 carry = false
    let roundUpBits;
    if (!somethingWasDropped) {
        roundUpBits = { bits: keptBits, carry: false };
    } else if (sign === 0) {
        roundUpBits = addOneBit(keptBits); // positive -> push value up
    } else {
        roundUpBits = { bits: keptBits, carry: false }; // negative -> just chop
    }

    // ROUND DOWN towards -inf:
    // if positive num, just chop... For binary 0, keep as 0, left stays 0 carry = false
    // if negative num, add 1 bit... For binary 1, make 0, left is 1 carry = true
    let roundDownBits;
    if (!somethingWasDropped) {
        roundDownBits = { bits: keptBits, carry: false };
    } else if (sign === 0) {
        roundDownBits = { bits: keptBits, carry: false };
    } else {
        roundDownBits = addOneBit(keptBits);
    }

    // convert to string for output
    return {
        chop: buildOutputString(sign, exponent, chopBits),
        roundUp: buildOutputString(sign, exponent, roundUpBits),
        roundDown: buildOutputString(sign, exponent, roundDownBits),
        nearest: buildOutputString(sign, exponent, nearestBits),
    };

    // END OF ROUNDING METHODS =====
}

// Adds 1 to the end of a bit string
// "0101" + 1 = "0110"
// "1111" + 1 = "0000" with a carry left over (OVERFLOW)
function addOneBit(bitString) {
    const bitArray = bitString.split("");
    let i = bitArray.length - 1;
    let carry = 1;

    while (i >= 0 && carry === 1) {
        if (bitArray[i] === "1") {
            bitArray[i] = "0"; // 1 + 1 = 0, carry 1
        } else {
            bitArray[i] = "1"; // 0 + 1 = 1, no carry
            carry = 0;
        }
        i--;
    }

    return { bits: bitArray.join(""), carry: carry === 1 };
}

// Turns a binary string like "-1010.101" into sign, exponent, mantissa bits
function parseBinaryInput(input) {
    if (!/^-?[01]+(\.[01]+)?$/.test(input)) {
        throw new Error("That's not a valid binary number (only 0s, 1s, and one '.' allowed)");
    }

    const sign = input.startsWith("-") ? 1 : 0;
    const withoutSign = input.replace("-", "");
    const parts = withoutSign.split(".");
    const wholePart = parts[0];
    const fractionPart = parts[1] || "";

    return normalizeToScientificForm(sign, wholePart, fractionPart);
}

// Turns a decimal string like "-10.75" into sign, exponent, mantissa bits
function parseDecimalInput(input) {
    const value = parseFloat(input);
    if (isNaN(value)) {
        throw new Error("That's not a valid decimal number");
    }

    const sign = (value < 0) ? 1 : 0;
    let whole = Math.floor(Math.abs(value));
    let fraction = Math.abs(value) - whole;

    const wholeBits = (whole === 0) ? "0" : whole.toString(2);

    // decimal -> binary fraction: keep multiplying by 2 and pull off integer part each time
    let fractionBits = "";
    for (let i = 0; i < 64 && fraction > 0; i++) {
        fraction = fraction * 2;
        if (fraction >= 1) {
            fractionBits += "1";
            fraction -= 1;
        } else {
            fractionBits += "0";
        }
    }

    return normalizeToScientificForm(sign, wholeBits, fractionBits);
}

// Takes the whole number bits and fraction bits and finds where the FIRST 1 is
function normalizeToScientificForm(sign, wholeBits, fractionBits) {
    const allBits = wholeBits + fractionBits;
    const pointPosition = wholeBits.length; // where binary point sits

    const firstOneIndex = allBits.indexOf("1");

    if (firstOneIndex === -1) {
        // no 1 bits at all = 0
        return { isZero: true };
    }

    // how many places the point moved
    const exponent = pointPosition - firstOneIndex - 1;
    const mantissaBits = allBits.substring(firstOneIndex + 1);

    return { isZero: false, sign, exponent, mantissaBits };
}

// Turns mantissa bits, exponent -> decimal for display
function reconstructDecimalValue(bits, exponent) {
    let fractionValue = 0;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] === "1") {
            fractionValue += Math.pow(2, -(i + 1)); // 2^-1, 2^-2, 2^-3...
        }
    }
    const mantissaValue = 1 + fractionValue; // add back the implicit leading 1
    return mantissaValue * Math.pow(2, exponent);
}

// final output string
function buildOutputString(sign, exponent, roundedResult) {
    let finalExponent = exponent;
    if (roundedResult.carry) {
        finalExponent = exponent + 1;
    }

    const finalBits = roundedResult.bits;
    let decimalValue = reconstructDecimalValue(finalBits, finalExponent);
    if (sign === 1) {
        decimalValue = decimalValue * -1;
    }

    const signSymbol = (sign === 1) ? "-" : "";

    return signSymbol + "1." + finalBits + " x 2^" + finalExponent + "  (= " + decimalValue + ")";
}

// this function checks whether the discarded bits require an increment.
export function shouldRoundUp(
    sign,
    method,
    keptLSB,
    remainder,
    divisor
) {
    if (
        remainder === 0n ||
        method === "chop"
    ) {
        return false;
    }

    if (method === "up") {
        return sign === 0;
    }

    if (method === "down") {
        return sign === 1;
    }

    const twice =
        remainder * 2n;

    return (
        twice > divisor ||
        (
            twice === divisor &&
            keptLSB === 1
        )
    );
}