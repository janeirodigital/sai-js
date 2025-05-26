import { LDP } from '@janeirodigital/interop-utils'
import { Memoize } from 'typescript-memoize'
import { ReadableResource, type ReadableShapeTree } from '.'
import type { InteropFactory } from '..'

export class ReadableDataRegistration extends ReadableResource {
  shapeTree?: ReadableShapeTree

  private async bootstrap(): Promise<void> {
    await this.fetchData()
    this.shapeTree = await this.factory.readable.shapeTree(this.registeredShapeTree)
  }

  public static async build(
    iri: string,
    factory: InteropFactory
  ): Promise<ReadableDataRegistration> {
    const instance = new ReadableDataRegistration(iri, factory)
    await instance.bootstrap()
    return instance
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value
  }

  @Memoize()
  get contains(): string[] {
    return this.getObjectsArray('contains', LDP).map((object) => object.value)
  }

  @Memoize()
  get iriPrefix(): string {
    return this.getObject('iriPrefix').value
  }
}
