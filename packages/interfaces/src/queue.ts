export interface IQueue {
  add(data: any): Promise<void>;
}
