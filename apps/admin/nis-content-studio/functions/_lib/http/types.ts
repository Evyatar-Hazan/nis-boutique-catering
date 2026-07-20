export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export interface ApiRequestContext<Environment> {
  readonly env: Environment;
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
}
