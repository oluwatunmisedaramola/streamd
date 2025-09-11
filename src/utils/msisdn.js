// Normalize MSISDN
export function normalizeMsisdn(input) {
  if (!input) return null;
  let msisdn = input.trim().replace(/[\s\-\(\)]+/g, "");
  if (msisdn.startsWith("+")) msisdn = msisdn.substring(1);
  if (msisdn.startsWith("0") && msisdn.length === 11) {
    msisdn = "234" + msisdn.substring(1);
  }
  if (msisdn.startsWith("234")) return msisdn;
  if (/^\d{10,11}$/.test(msisdn)) return "234" + msisdn.replace(/^0/, "");
  return msisdn;
}

// Detect carrier from MSISDN prefix
export function detectCarrier(msisdn) {
  const localPart = msisdn.startsWith("234") ? msisdn.substring(3) : msisdn;
  const mtnPrefixes = ["803", "806", "703", "704", "706", "810", "813", "814", "816", "903", "906", "913"];
  const airtelPrefixes = ["802", "808", "708", "701", "812", "902", "907", "901", "904", "911", "912"];
  if (mtnPrefixes.some((p) => localPart.startsWith(p))) return "MTN";
  if (airtelPrefixes.some((p) => localPart.startsWith(p))) return "Airtel";
  return null;
}
