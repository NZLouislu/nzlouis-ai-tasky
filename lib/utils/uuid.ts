export function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as unknown as { randomUUID: () => string }).randomUUID ===
      "function"
  ) {
    return (crypto as unknown as { randomUUID: () => string }).randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (
    typeof crypto !== "undefined" &&
    typeof (
      crypto as unknown as { getRandomValues: (bytes: Uint8Array) => void }
    ).getRandomValues === "function"
  ) {
    (
      crypto as unknown as { getRandomValues: (bytes: Uint8Array) => void }
    ).getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}

export function isValidUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  // Flexible UUID validation to support various test data formats
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}
