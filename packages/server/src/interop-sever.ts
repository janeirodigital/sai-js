
export interface InteropServerOptions {
  log: boolean;
}

export class InteropServer {

  constructor(
    private fetch: Function,
    options: InteropServerOptions,
  ) { }
}
