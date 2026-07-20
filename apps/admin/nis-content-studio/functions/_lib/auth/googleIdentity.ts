import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from "jose";

import { ApiError } from "../http/errors";

const googleIssuers = ["https://accounts.google.com", "accounts.google.com"];
const googleKeySet = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export interface GoogleIdentity {
  readonly email: string;
  readonly subject: string;
}

const readIdentity = (payload: JWTPayload): GoogleIdentity => {
  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    payload.email_verified !== true ||
    typeof payload.exp !== "number"
  ) {
    throw new ApiError(
      401,
      "invalid_google_token",
      "Google identity token is invalid.",
    );
  }

  return {
    email: payload.email.trim().toLowerCase(),
    subject: payload.sub,
  };
};

export const verifyGoogleIdToken = async (
  token: string,
  clientId: string,
  keySet: JWTVerifyGetKey = googleKeySet,
): Promise<GoogleIdentity> => {
  if (!clientId) {
    throw new ApiError(
      503,
      "identity_not_configured",
      "Google identity is not configured.",
    );
  }

  try {
    const { payload } = await jwtVerify(token, keySet, {
      algorithms: ["RS256"],
      audience: clientId,
      issuer: googleIssuers,
    });
    return readIdentity(payload);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      401,
      "invalid_google_token",
      "Google identity token is invalid.",
    );
  }
};
