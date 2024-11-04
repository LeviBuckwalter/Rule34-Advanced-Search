export function roundTo(input, decimalPlaces) {
    return Math.round(input * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
}
