import { DatasetCore } from 'rdf-js'
import { getOneMatchingQuad } from 'interop-utils'
import { INTEROP } from 'interop-namespaces'

export class DataRegistration {
  dataset: DatasetCore
  registeredShapeTree: string

  constructor(dataset: DatasetCore) {
    this.dataset = dataset

    const quadPattern = [ null, INTEROP.registeredShapeTree, null, null ]
    this.registeredShapeTree = getOneMatchingQuad(this.dataset, ...quadPattern).object.value

  }
}
