export interface PasswordResetLink {
  token: string;
  email: string;
}

export function extractPasswordReset(value: string): PasswordResetLink | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "anot:" || url.hostname !== "reset-password") return null;

    const token = url.searchParams.get("token")?.trim();
    const email = url.searchParams.get("email")?.trim();
    if (!token || !email) return null;

    return { token, email };
  } catch {
    return null;
  }
}
