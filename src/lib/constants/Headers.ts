export enum Headers {
  VTEX_ORIGINAL_CREDENTIAL = 'x-vtex-original-credential',

  // If set to 'true' in the request, will hit the runtime-base server, instead of the app server.
  VTEX_RUNTIME_API = 'x-vtex-runtime-api',

  // Specify a specific pod to receive the request
  VTEX_STICKY_HOST = 'x-vtex-sticky-host',

  // Specify the target cluster for the request.
  // Works only on myvtexdev domain
  VTEX_UPSTREAM_TARGET = 'x-vtex-upstream-target',
}