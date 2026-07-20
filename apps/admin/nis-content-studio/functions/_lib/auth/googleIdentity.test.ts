// @vitest-environment node

import { beforeAll, describe, expect, it } from "vitest";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey,
} from "jose";

import { ApiError } from "../http/errors";
import { verifyGoogleIdToken } from "./googleIdentity";

const audience = "studio-client.apps.googleusercontent.com";
let privateKey: CryptoKey;
let localKeySet: JWTVerifyGetKey;

beforeAll(async () => {
  const keys = await generateKeyPair("RS256");
  privateKey = keys.privateKey;
  const publicJwk = await exportJWK(keys.publicKey);
  localKeySet = createLocalJWKSet({
    keys: [{ ...publicJwk, alg: "RS256", kid: "test-key", use: "sig" }],
  });
});

const signToken = async (overrides: {
  readonly audience?: string;
  readonly emailVerified?: boolean;
  readonly expiresIn?: string;
} = {}): Promise<string> =>
  new SignJWT({
    email: "Owner@Example.com",
    email_verified: overrides.emailVerified ?? true,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer("https://accounts.google.com")
    .setAudience(overrides.audience ?? audience)
    .setSubject("google-subject-1")
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? "5m")
    .sign(privateKey);

describe("verifyGoogleIdToken", () => {
  it("accepts a signed Google identity with the expected claims", async () => {
    const identity = await verifyGoogleIdToken(
      await signToken(),
      audience,
      localKeySet,
    );

    expect(identity).toEqual({
      email: "owner@example.com",
      subject: "google-subject-1",
    });
  });

  it.each([
    ["a forged token", "forged.token.value"],
    ["an expired token", () => signToken({ expiresIn: "-1s" })],
    ["the wrong audience", () => signToken({ audience: "other-client" })],
    ["an unverified email", () => signToken({ emailVerified: false })],
  ])("rejects %s", async (_label, tokenFactory) => {
    const token = typeof tokenFactory === "string" ? tokenFactory : await tokenFactory();

    await expect(
      verifyGoogleIdToken(token, audience, localKeySet),
    ).rejects.toMatchObject({
      code: "invalid_google_token",
      status: 401,
    } satisfies Partial<ApiError>);
  });
});
