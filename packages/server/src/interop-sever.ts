/* eslint-disable */
// TODO (angel) re-enable eslint when this moves forward a little bit
export interface InteropServerOptions {
  log: boolean;
}

export class InteropServer {
  constructor(
    private fetch: Function,
    options: InteropServerOptions,
  ) { }
}
