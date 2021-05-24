import { Store } from 'n3'
import { INTEROP } from 'interop-namespaces'

export class DataRegistration {
  dataset: Store //FIXME DatasetCore n3 needs to update their types
  registeredShapeTree: string

  constructor(dataset: Store) { //FIXME DatasetCore n3 needs to update their types
    this.dataset = dataset
    const matches =  this.dataset.match(
      null,
      INTEROP.registeredShapeTree,
      null,
      null
      )
    //@ts-ignore FIXME n3 needs to update their types
    this.registeredShapeTree = [...matches][0].object.value
  }
}
