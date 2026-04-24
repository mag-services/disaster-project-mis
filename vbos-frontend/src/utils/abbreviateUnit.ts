/**
 * Abbreviates common units to their standard short forms.
 *
 * @param unit - The full unit name (e.g., "kilogram", "kilometer")
 * @returns Abbreviated unit (e.g., "kg", "km") or original if no abbreviation exists
 *
 * @example
 * abbreviateUnit("kilogram") // "kg"
 * abbreviateUnit("meter") // "m"
 * abbreviateUnit("schools") // "schools" (no abbreviation, returns original)
 */
export function abbreviateUnit(unit: string | null | undefined): string | null | undefined {
  if (!unit) return undefined;

  // Normalize to lowercase and trim for comparison
  const normalizedUnit = unit.toLowerCase().trim();

  // Common unit abbreviations
  const abbreviations: Record<string, string> = {
    // Weight/Mass
    "kilogram": "kg",
    "kilograms": "kg",
    "gram": "g",
    "grams": "g",
    "tonne": "t",
    "tonnes": "t",
    "ton": "t",
    "tons": "t",
    "metric ton": "t",
    "metric tons": "t",

    // Distance/Length
    "kilometer": "km",
    "kilometers": "km",
    "kilometre": "km",
    "kilometres": "km",
    "meter": "m",
    "meters": "m",
    "metre": "m",
    "metres": "m",
    "centimeter": "cm",
    "centimeters": "cm",
    "centimetre": "cm",
    "centimetres": "cm",
    "millimeter": "mm",
    "millimeters": "mm",
    "millimetre": "mm",
    "millimetres": "mm",

    // Volume
    "liter": "L",
    "liters": "L",
    "litre": "L",
    "litres": "L",
    "milliliter": "mL",
    "milliliters": "mL",
    "millilitre": "mL",
    "millilitres": "mL",

    // Area
    "square kilometer": "km²",
    "square kilometers": "km²",
    "square kilometre": "km²",
    "square kilometres": "km²",
    "square meter": "m²",
    "square meters": "m²",
    "square metre": "m²",
    "square metres": "m²",
    "hectare": "ha",
    "hectares": "ha",

    // Time
    "hour": "hr",
    "hours": "hr",
    "minute": "min",
    "minutes": "min",
    "second": "s",
    "seconds": "s",

    // Other
    "number": "\n",
    "vatu": "VT",
    "percent": "%",
    "percentage": "%",
    "degree": "°",
    "degrees": "°",
    "celsius": "°C",
    "fahrenheit": "°F",
  };

  return abbreviations[normalizedUnit] || normalizedUnit;
}
