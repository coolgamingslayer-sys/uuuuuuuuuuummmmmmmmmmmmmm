import { SignJWT, jwtVerify, JWTPayload } from "jose";

function getSecret(): Uint8Array {
  const secret = process.env.DOWNLOAD_JWT_SECRET;
  if (!secret) {
    throw new Error("Missing DOWNLOAD_JWT_SECRET env");
  }
  return new TextEncoder().encode(secret);
}

export async function signDownloadToken(payload: JWTPayload, expiresInSeconds: number = 60 * 60 * 72) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(getSecret());
}

export async function verifyDownloadToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}