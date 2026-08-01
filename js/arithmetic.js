import { convertDecimalToIEEE754 } from "./convertDecimal.js";
import { shouldRoundUp } from "./rounding.js";

// constants for math so we dont have to keep calculating 2^23 and 2^24
const TWO23 = 8388608n;
const TWO24= 16777216n;

// this function returns 2 raised to the given whole number power.
function powerOfTwo(power) {
    return 2n ** BigInt(power);
}

// this function applies the sign of a floating point number to its coefficient.
function signedCoefficient(number) {
    return number.sign ? -number.coefficient : number.coefficient;
}

// this function moves a coefficient to the common power used during addition.
function alignCoefficient(number, commonPower) {
    return signedCoefficient(number) * powerOfTwo(number.power - commonPower);
}

// this function gets the actual unbiased exponent used in binary scientific notation.
function unbiasedExponent(number) {
    if(number.kind === "normal") {
        return number.exponent - 127;
    }

    return -126;
}

// this function returns the significand of a floating point number in binary form.
function significandForm(number) {
    const fraction = number.fraction.toString(2).padStart(23, "0");
    const hiddenBit = number.kind === "normal" ? "1" : "0";

    return `${hiddenBit}.${fraction}`;
}

// this function displays a floating point number in binary scientific notation.
function scientificForm(number) {
    if(number.kind === "nan") return "NaN";
    if(number.kind === "infinity") return number.sign ? "-Infinity" : "+Infinity";
    if(number.kind === "zero") return number.sign ? "-0" : "+0";

    const sign = number.sign ? "-" : "";

    return `${sign}${significandForm(number)} x 2^${unbiasedExponent(number)}`;
}



// this function gets the 32 bit float and breaks it into sign, exp and fraction fields. it checks if its normal or special and outputs an object with all these parts so we can use it later.
function decode(bits) {
    // shift right 31 times to just get the 1 bit sign
    const sign= bits >>> 31;
    // shift right 23 times and mask with 11111111 to get the 8 bit exponent
    const  exponent = (bits >>> 23) & 0xFF;
    // mask with 23 1s to get the fraction bits
    const fraction = bits & 0x7FFFFF;

    let kind = "normal";

    // check all 1s in exp for nan/inf
    if(exponent === 0xFF) {
        kind = fraction ? "nan" : "infinity";
    }
    // check all 0s in exp for zero or subnormal
    else if (exponent === 0) {
        kind = fraction ? "subnormal" : "zero";
    }

    // coefficient adds the hidden 1 if its a normal number, power removes the 127 bias and the 23 bit shift
    return {
        bits, sign, exponent, fraction, kind,
        coefficient: kind === "normal" ? TWO23 + BigInt(fraction) : BigInt(fraction),
        power: kind === "normal" ? exponent - 150 : -149
    };
}

// this function takes what the user typed in and figures out if its hex, nan, infinity or normal decimal. it then converts it to bits and calls decode to output the parsed object.
function parseOperand(raw) {
    // remove extra spaces from input
    const text= raw.trim();

    if (!text) {
        throw new Error("Both operands are required.");
    }

    // check if user literally typed nan
    if(/^[+-]?nan$/i.test(text)) {
        return decode(0x7FC00000);
    }
    // check if user typed positive infinity
    if (/^\+?infinity$/i.test(text)) {
        return decode(0x7F800000);
    }
    // check if user typed negative infinity
    if(/^-infinity$/i.test(text)) {
        return decode(0xFF800000);
    }

    // check if its a hex string starting with 0x
    if (/^0x[0-9a-f]{8}$/i.test(text)) {
        return decode(parseInt(text.slice(2), 16) >>> 0);
    }

    // if its not a valid decimal number at this point, throw an error
    if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
        throw new Error(`"${raw}" is not a valid decimal or IEEE hexadecimal value. Only letters A-F are allowed. Please also ensure that you entered 8 digits for Hex.`);
    }

    // if it survived all that, it must be a normal decimal number. use the imported function to convert it.
    const result = convertDecimalToIEEE754(text);
    return decode(parseInt(result.hex.slice(2), 16) >>> 0);
}

// this function shifts the integer and rounds the removed bits using round to nearest ties to even. it checks the remainder and calls shouldRoundUp to see if we add 1. outputs the new value and a string note for the steps.
function roundInteger(value, shift, sign) {
    // if shift is positive we just shift left and dont lose anything, so no rounding needed
    if (shift >= 0) {
        return { value: value * powerOfTwo(shift), note: "No bits were discarded, so no rounding was needed." };
    }

    // figure out what were dividing by to do the right shift
    const divisor = powerOfTwo(-shift);

    // kept is the part that stays, remainder is the bits that get chopped off
    const kept= value / divisor;
    const remainder = value% divisor;
    const lastBit = Number(kept % 2n);

    // pass everything to the imported groupmate rounding function using the binary default
    const increment = shouldRoundUp(sign, "nearest", lastBit, remainder, divisor);

    let position;

    if(remainder === 0n) {
        position = "nothing was discarded";
    } else if(remainder * 2n < divisor) {
        position = "the discarded value is below halfway";
    } else if(remainder * 2n > divisor) {
        position = "the discarded value is above halfway";
    } else {
        position = "the discarded value is exactly halfway";
    }

    // make a string to explain what happened for the steps output
    const note = remainder === 0n
        ? "No bits were discarded, so no rounding was needed."
        : `${position}. The kept least significant bit is ${lastBit}, so the value was ${increment ? "increased" : "kept"} using nearest ties to even.`;

    return {
        // add 1 if the rounding function said yes
        value: kept + (increment ? 1n : 0n), note
    };
}

// this function gives the signed infinity bits when our exponent goes too high.
function overflowBits(sign) {
    return ((sign << 31) | 0x7F800000) >>> 0;
}

// this function rounds the exact math answer into a proper ieee 754 single precision float. it handles underflow and overflow stuff too. outputs the final bits and a note.
function roundToFloat32(coefficient, power, zeroSign = 0) {
    // early exit if exact zero so we dont do useless math
    if(coefficient === 0n) {
        return { bits: zeroSign ? 0x80000000 : 0, note: "The exact result is zero." };
    }

    // get the sign and absolute value
    const sign = coefficient < 0n ? 1 : 0;
    const magnitude = coefficient < 0n ? -coefficient : coefficient;

    // figure out the actual exponent by checking bit length
    let exponent = magnitude.toString(2).length - 1 + power;

    // if its way too big, just overflow it immediately
    if(exponent > 127) {
        return { bits: overflowBits(sign), note: "The result overflowed." };
    }

    // if exponent is too small, its a subnormal number so we handle it differently
    if (exponent < -126) {
        const rounded = roundInteger(magnitude, power + 149, sign);

        // if it rounded all the way down to 0
        if(rounded.value === 0n) {
            return { bits: sign ? 0x80000000 : 0, note: `The result underflowed to zero. ${rounded.note}` };
        }

        // if rounding pushed it back up into normal number territory
        if (rounded.value >= TWO23) {
            return { bits: ((sign << 31) | (1 << 23)) >>> 0, note: `The result became the smallest normal number. ${rounded.note}` };
        }

        // normal subnormal result
        return { bits: ((sign << 31) | Number(rounded.value)) >>> 0, note: `The result is subnormal. ${rounded.note}` };
    }

    // normal number rounding
    const rounded = roundInteger(magnitude, power - (exponent - 23), sign);
    let mantissa = rounded.value;

    // check if mantissa got too big after rounding and shift it back
    if (mantissa >= TWO24) {
        mantissa = mantissa / 2n;
        exponent++;
    }

    // check overflow again just in case the rounding pushed the exponent too high
    if (exponent > 127) {
        return { bits: overflowBits(sign), note: "Rounding caused overflow." };
    }

    // pack the sign, biased exponent, and fraction back into 32 bits using bitwise OR
    const bits = ((sign << 31) | ((exponent + 127) << 23) | Number(mantissa - TWO23)) >>> 0;
    return { bits, note: rounded.note };
}

// this function catches weird inputs like nan and infinity or zero before doing the actual math so it doesnt break. outputs an object with the bits and the reason why.
function specialCase(a, b, operation) {
    // anything touching nan is nan
    if(a.kind === "nan" || b.kind === "nan") {
        return { bits: 0x7FC00000, reason: "NaN was used." };
    }

    if(operation === "add") {
        // adding opposing infinities makes no sense so its nan
        if(a.kind === "infinity" && b.kind === "infinity" && a.sign !== b.sign) {
            return { bits: 0x7FC00000, reason: "+Infinity plus -Infinity is NaN." };
        }
        // inf + anything is inf
        if(a.kind === "infinity") return { bits: a.bits, reason: "Operand A is Infinity." };
        if(b.kind === "infinity") return { bits: b.bits, reason: "Operand B is Infinity." };

        // not a special case
        return null;
    }

    const zeroA= a.kind === "zero";
    const zeroB = b.kind === "zero";

    // multiplying infinity by 0 is illegal
    if((a.kind === "infinity" && zeroB) || (b.kind === "infinity" && zeroA)) {
        return { bits: 0x7FC00000, reason: "Infinity multiplied by zero is NaN." };
    }

    // infinity multiplied by a normal number is signed infinity
    if (a.kind === "infinity" || b.kind === "infinity") {
        return { bits: (((a.sign ^ b.sign) << 31) | 0x7F800000) >>> 0, reason: "A value multiplied by Infinity gives signed Infinity." };
    }

    // anything multiplied by 0 is 0, figure out the sign with XOR
    if(zeroA || zeroB) {
        return { bits: (a.sign ^ b.sign) ? 0x80000000 : 0, reason: "Multiplication by zero gives signed zero." };
    }

    // not a special case
    return null;
}

// this function takes the final bits and formats it into binary string, hex and decimal so we can show it on the html. outputs an object with those 3 strings.
function formatResult(bits) {
    // convert bits to binary string and pad to 32
    const raw = bits.toString(2).padStart(32, "0");

    // use dataview to read the bits as a float32 exactly how the computer sees it
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, bits);
    const value = view.getFloat32(0);

    // format the decimal string, dealing with edge cases JS is weird about
    let decimal = String(value);

    if(Number.isNaN(value)) decimal = "NaN";
    else if (value === Infinity) decimal = "+Infinity";
    else if (value === -Infinity) decimal = "-Infinity";
    else if(Object.is(value, -0)) decimal = "-0";

    return {
        // slice the binary string to look nice with spaces
        binary: `${raw[0]} ${raw.slice(1, 9)} ${raw.slice(9)}`,
        // convert to hex string
        hex: "0x" + bits.toString(16).toUpperCase().padStart(8, "0"),
        decimal
    };
}

// this function does the main math for float32 addition or multiplication. it aligns exponents, adds or multiplies the significands, rounds it, and saves every step. outputs the final formatted result and the steps array.
export function computeArithmetic(first, second, operation) {
    // basic error checking
    if (operation !== "add" && operation !== "multiply") {
        throw new Error("Invalid arithmetic operation.");
    }

    // parse both inputs
    const a = parseOperand(first);
    const b= parseOperand(second);

    // check if we can skip the math cuz of special cases
    const special = specialCase(a, b, operation);

    const shownA = formatResult(a.bits);
    const shownB = formatResult(b.bits);

    // array to hold the step by step output for the assignment reqs
    const steps = [
        `1. Decode A: ${shownA.binary} = ${shownA.hex}`,
        `   A = ${scientificForm(a)}`,
        `   Decode B: ${shownB.binary} = ${shownB.hex}`,
        `   B = ${scientificForm(b)}`
    ];

    let bits;

    if (special) {
        bits = special.bits;
        steps.push(`2. Special case: ${special.reason}`);
    } else if(operation === "add") {
        // for addition we gotta align the decimal points basically
        const commonPower = Math.min(a.power, b.power);

        // shift left to align
        const left = alignCoefficient(a, commonPower);
        const right = alignCoefficient(b, commonPower);
        const exact = left + right;

        const exponentA = unbiasedExponent(a);
        const exponentB = unbiasedExponent(b);
        const alignedExponent = Math.max(exponentA, exponentB);
        const shiftA = alignedExponent - exponentA;
        const shiftB = alignedExponent - exponentB;

        // preserve negative zero only when both inputs are negative zero
        const zeroSign = (a.kind === "zero" && b.kind === "zero" && a.sign === b.sign) ? a.sign : 0;

        // round the exact addition result back into 32 bits
        const rounded = roundToFloat32(exact, commonPower, zeroSign);
        bits = rounded.bits;

        steps.push(
            `2. Compare exponents: A = ${exponentA}, B = ${exponentB}.`,
            `   Shift A right by ${shiftA} bit(s) and B right by ${shiftB} bit(s) to use exponent ${alignedExponent}.`,
            `3. Add the aligned significands.`,
            `4. Normalize and round to nearest, ties to even: ${rounded.note}`
        );
    } else {
        // multiplication is easier, just multiply coefficients and add powers
        const left= signedCoefficient(a);
        const right = signedCoefficient(b);
        const power = a.power + b.power;

        const exponentA = unbiasedExponent(a);
        const exponentB = unbiasedExponent(b);
        const newExponent = exponentA + exponentB;

        // round the exact multiplication result
        const rounded = roundToFloat32(left * right, power);
        bits = rounded.bits;

        steps.push(
            `2. Add unbiased exponents: ${exponentA} + ${exponentB} = ${newExponent}.`,
            `3. Multiply significands: ${significandForm(a)} x ${significandForm(b)}.`,
            `4. Normalize and round to nearest, ties to even: ${rounded.note}`
        );
    }

    // format the final result for the html
    const result = formatResult(bits);
    const finalStep = special ? 3 : 5;
    steps.push(`${finalStep}. Final result: ${result.binary} = ${result.hex} = ${result.decimal}`);

    return { ...result, steps };
}

// this function links our math stuff to the html buttons and inputs. it puts the outputs on the screen when u click compute.
function setupArithmeticPage() {
    const byId = id => document.getElementById(id);
    const button = byId("compute-btn");

    if(!button) return;

    // this function disables the hex radio button if the input doesnt look like a hex string. it also switches to decimal if the user typed garbage and hex was selected.
    function wireFormatToggle(inputId, hexRadioId, decimalRadioId) {
        const input = byId(inputId);
        const hexRadio = byId(hexRadioId);
        const decimalRadio = byId(decimalRadioId);
        if (!input || !hexRadio || !decimalRadio) return;

        input.addEventListener("input", () => {
            const value = input.value.trim();
            const looksHex = /^(0x)?[0-9a-f]{8}$/i.test(value);

            hexRadio.disabled = !looksHex;

            if (!looksHex && hexRadio.checked) {
                decimalRadio.checked = true;
            }
        });
    }

    wireFormatToggle("op-1", "op1-hex", "op1-decimal");
    wireFormatToggle("op-2", "op2-hex", "op2-decimal");

    //sets hex just in case only numbers are entered
    function prepareOperand(rawValue, hexRadioId) {
        const hexRadio = byId(hexRadioId);
        const value = rawValue.trim();

        if (hexRadio && hexRadio.checked && !/^0x/i.test(value)) {
            return "0x" + value;
        }
        return value;
    }


    // listen for the click event on the button
    button.addEventListener("click", () => {
        try {
            // grab the values from the dom and run the main math function
            const result = computeArithmetic(
                prepareOperand(byId("op-1").value, "op1-hex"),
                prepareOperand(byId("op-2").value, "op2-hex"),
                byId("operation").value
            );

            // update the dom text with the results
            byId("binary").textContent = result.binary;
            byId("hex").textContent = result.hex;
            byId("decimal").textContent = result.decimal;

            if (byId("steps")) {
                byId("steps").textContent = result.steps.join("\n");
            }
        } catch (error) {
            // show error if user typed garbage
            alert(error.message);
        }
    });
}

document.addEventListener("DOMContentLoaded", setupArithmeticPage);
