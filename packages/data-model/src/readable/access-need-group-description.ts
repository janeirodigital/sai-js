import { INTEROP } from '@janeirodigital/interop-utils'
import type { InteropFactory } from '..'
import { ReadableAccessDescription } from './access-description'

export class ReadableAccessNeedGroupDescription extends ReadableAccessDescription {
  // TODO handle missing value
  public get hasAccessNeedGroup(): string {
    return this.getObject(INTEROP.hasAccessNeedGroup)!.value
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData()
  }

  public static async build(
    iri: string,
    factory: InteropFactory
  ): Promise<ReadableAccessNeedGroupDescription> {
    const instance = new ReadableAccessNeedGroupDescription(iri, factory)
    await instance.bootstrap()
    return instance
  }
}
