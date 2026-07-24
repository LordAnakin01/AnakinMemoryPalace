import crypto from "crypto";

export const AUTH_COOKIE = "mp_auth";

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function expectedToken() {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET).update("memory-palace-authenticated").digest("hex");
}

export function checkPasscode(passcode) {
  return typeof passcode === "string" && timingSafeStringEqual(passcode, process.env.APP_PASSCODE || "");
}

export function isAuthed(request) {
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (!cookie) return false;
  return timingSafeStringEqual(cookie, expectedToken());
}

export function authCookieValue() {
  return expectedToken();
}
