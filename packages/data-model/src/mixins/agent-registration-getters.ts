import { Memoize } from 'typescript-memoize'
import { ReadableResource } from '../readable'

export class AgentRegistrationGetters extends ReadableResource {
  @Memoize()
  get registeredAgent(): string {
    return this.getObject('registeredAgent').value
  }
}
