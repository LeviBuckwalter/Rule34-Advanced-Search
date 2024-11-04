export function roundTo(input: number, decimalPlaces: number): number {
    return Math.round(input * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
}
