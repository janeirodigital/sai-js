import { Resource } from '..'

export class ReadableResource extends Resource {
  protected async fetchData(): Promise<void> {
    const response = await this.fetch(this.iri)
    if (!response.ok) {
      console.error(response)
      throw new Error(`fetchData failed for: ${this.iri}`)
    }
    this.dataset = await response.dataset()
  }
}
