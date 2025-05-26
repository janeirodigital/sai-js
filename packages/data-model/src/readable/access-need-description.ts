import { INTEROP } from '@janeirodigital/interop-utils'
import type { InteropFactory } from '..'
import { ReadableAccessDescription } from './access-description'

export class ReadableAccessNeedDescription extends ReadableAccessDescription {
  // TODO handle missing value
  public get hasAccessNeed(): string {
    return this.getObject(INTEROP.hasAccessNeed)!.value
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData()
  }

  public static async build(
    iri: string,
    factory: InteropFactory
  ): Promise<ReadableAccessNeedDescription> {
    const instance = new ReadableAccessNeedDescription(iri, factory)
    await instance.bootstrap()
    return instance
  }
}
