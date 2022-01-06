import { Resource } from '..';
export class ReadableResource extends Resource {
  protected async fetchData(): Promise<void> {
    const response = await this.fetch(this.iri);
    this.dataset = await response.dataset();
  }
}
