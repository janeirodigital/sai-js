export class RedisConnectionInfo {
  public db?: number

  public port?: number

  constructor(
    public host?: string,
    port?: string,
    public username?: string,
    public password?: string,
    db?: string
  ) {
    this.port = Number(port) || undefined
    this.db = Number(db) || undefined
  }
}
