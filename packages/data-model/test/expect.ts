import toBeRdfDatasetContaining from 'jest-rdf/lib/matchers/toBeRdfDatasetContaining'
import toEqualRdfTerm from 'jest-rdf/lib/matchers/toEqualRdfTerm'
import { expect as viexpect } from 'vitest'
viexpect.extend(toBeRdfDatasetContaining)
viexpect.extend(toEqualRdfTerm)

export const expect = viexpect
