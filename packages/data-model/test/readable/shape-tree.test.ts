import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { test } from 'vitest'
import { ApplicationFactory, ReadableShapeTree } from '../../src'
import type { ShapeTreeReference } from '../../src/readable/shape-tree'
import { expect } from '../expect'

const factory = new ApplicationFactory({ fetch, randomUUID })
const snippetIri = 'https://solidshapes.example/trees/Project'
const taskTreeIri = 'https://solidshapes.example/trees/Task'

test('factory should build a shape tree', async () => {
  const shapeTree = await factory.readable.shapeTree(snippetIri)
  expect(shapeTree).toBeInstanceOf(ReadableShapeTree)
})

test.todo('provides describesInstance predicate')

test('provides references', async () => {
  const shapeTree = await factory.readable.shapeTree(snippetIri)
  expect(shapeTree.references).toStrictEqual(
    expect.arrayContaining([
      {
        shapeTree: taskTreeIri,
        viaPredicate: expect.objectContaining({
          value: 'https://vocab.example/project-management/hasTask',
        }),
      } as ShapeTreeReference,
    ])
  )
})

test('should allow to get Predicate for a referenced tree', async () => {
  const shapeTree = await factory.readable.shapeTree(snippetIri)
  const expectedPredicate = 'https://vocab.example/project-management/hasTask'
  const predicateToTask = shapeTree.getPredicateForReferenced(taskTreeIri)
  expect(predicateToTask.value).toBe(expectedPredicate)
})

test('should get description for language', async () => {
  const lang = 'en'
  const shapeTree = await factory.readable.shapeTree(snippetIri, lang)
  expect(shapeTree.descriptions[lang]).toBeDefined()
  expect(shapeTree.descriptions[lang].label).toBe('Projects')
  const otherLang = 'pl'
  shapeTree.descriptions[otherLang] = (await shapeTree.getDescription(otherLang))!
  expect(shapeTree.descriptions[otherLang]).toBeDefined()
  expect(shapeTree.descriptions[otherLang].label).toBe('Projekty')
})

test('should gracefully fail if no description set for language', async () => {
  const lang = 'fr'
  const shapeTree = await factory.readable.shapeTree(snippetIri, lang)
  expect(shapeTree.descriptions[lang]).toBeUndefined()
})

test('should gracefully fail if description set with missing description for language', async () => {
  const lang = 'de'
  const shapeTree = await factory.readable.shapeTree(snippetIri, lang)
  expect(shapeTree.descriptions[lang]).toBeUndefined()
})

test('should get description languages', async () => {
  const lang = 'fr'
  const shapeTree = await factory.readable.shapeTree(snippetIri, lang)
  expect([...shapeTree.descriptionLanguages]).toStrictEqual(['en', 'pl', 'de'])
})
