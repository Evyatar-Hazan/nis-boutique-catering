export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export interface ApiPrincipal {
  readonly adminId: string;
  readonly displayName: string;
  readonly email: string;
  readonly expiresAt: number;
  readonly sessionId: string;
}

export interface ApiRateLimitPolicy {
  readonly limit: number;
  readonly scope: "login" | "publish" | "upload";
  readonly windowSeconds: number;
}

export interface ApiSecurityPolicy {
  readonly allowedContentTypes?: readonly string[];
  readonly authenticated?: boolean;
  readonly maxBodyBytes?: number;
  readonly rateLimit?: ApiRateLimitPolicy;
  readonly sameOrigin?: boolean;
}

export interface ApiRequestContext<Environment> {
  readonly env: Environment;
  readonly principal: ApiPrincipal | null;
  readonly request: Request;
  readonly requestId: string;
}

export type ApiHandler<Environment> = (
  context: ApiRequestContext<Environment>,
) => Promise<Response>;

export interface ApiRoute<Environment> {
  readonly handler: ApiHandler<Environment>;
  readonly method: ApiMethod;
  readonly path: string;
  readonly security?: ApiSecurityPolicy;
}

export type ApiGuard<Environment> = (
  context: Omit<ApiRequestContext<Environment>, "principal">,
  route: ApiRoute<Environment>,
) => Promise<ApiPrincipal | null>;
