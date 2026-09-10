const INVITE_PREFIXES = [
  "anot://join?code=",
  "https://app.anot.com/join?code=",
];

export function extractInviteCode(value: string): string | null {
  const input = value.trim();
  const prefix = INVITE_PREFIXES.find((candidate) => input.toLowerCase().startsWith(candidate));
  if (!prefix) return null;

  const encodedCode = input.slice(prefix.length).split("&", 1)[0];
  if (!encodedCode) return null;

  try {
    const code = decodeURIComponent(encodedCode).trim().toUpperCase();
    return code || null;
  } catch {
    return null;
  }
}
