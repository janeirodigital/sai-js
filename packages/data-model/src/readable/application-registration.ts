import { Mixin } from 'ts-mixer'
import { type ReadableAccessGrant, ReadableContainer } from '.'
import type { InteropFactory } from '..'
import { AgentRegistrationGetters } from '../mixins/agent-registration-getters'

export class ReadableApplicationRegistration extends Mixin(
  ReadableContainer,
  AgentRegistrationGetters
) {
  hasAccessGrant: ReadableAccessGrant

  private async buildAccessGrant(): Promise<void> {
    const accessGrantNode = this.getObject('hasAccessGrant')
    this.hasAccessGrant = await this.factory.readable.accessGrant(accessGrantNode.value)
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData()
    await this.buildAccessGrant()
  }

  public static async build(
    iri: string,
    factory: InteropFactory
  ): Promise<ReadableApplicationRegistration> {
    const instance = new ReadableApplicationRegistration(iri, factory)
    await instance.bootstrap()
    return instance
  }
}
