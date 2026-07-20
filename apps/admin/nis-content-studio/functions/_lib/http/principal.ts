import { ApiError } from "./errors";
import type { ApiPrincipal } from "./types";

export const requireApiPrincipal = (
  principal: ApiPrincipal | null,
): ApiPrincipal => {
  if (!principal) {
    throw new ApiError(
      500,
      "authorization_policy_error",
      "Authorization policy failed.",
    );
  }
  return principal;
};
