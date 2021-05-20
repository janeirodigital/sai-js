import { Store, DataFactory } from 'n3'

export class DataRegistration {
  dataset: Store //FIXME DatasetCore n3 needs to update their types
  registeredShapeTree: string

  constructor(dataset: Store) { //FIXME DatasetCore n3 needs to update their types
    this.dataset = dataset
    const matches =  this.dataset.match(
      null,
      DataFactory.namedNode('http://www.w3.org/ns/solid/interop#registeredShapeTree'),
      null,
      null
      )
    //@ts-ignore FIXME n3 needs to update their types
    this.registeredShapeTree = [...matches][0].object.value
  }
}