import { DataFactory, Store } from 'n3'
import { describe, expect, test } from 'vitest'
import { createFetch, createStatefulFetch, statelessFetch } from '../src'

describe('common', () => {
  test('should strip fragment', async () => {
    const url = 'https://alice.example/#id'
    const response = await statelessFetch(url)
    expect(response.ok).toBeTruthy()
  })

  test('should set text on response', async () => {
    const url = 'https://solidshapes.example/shapes/Project'
    const response = await statelessFetch(url, { headers: { Accept: 'text/shex' } })
    const text = await response.text()
    expect(text.length).toBeGreaterThan(0)
  })

  test('should provide Content-Type header', async () => {
    const url = 'https://solidshapes.example/shapes/Project'
    const response = await statelessFetch(url)
    expect(response.headers.get('Content-Type')).toBe('text/turtle')
  })

  test('should provide fake Link header', async () => {
    const url = 'https://solidshapes.example/shapes/Project'
    const response = await statelessFetch(url)
    expect(response.headers.get('Link')).toBeTruthy()
  })

  test('should throw when getting header other than Content-Type', async () => {
    const url = 'https://solidshapes.example/shapes/Project'
    const response = await statelessFetch(url)
    expect(() => response.headers.get('Something-Else')).toThrow('Something-Else not supported')
  })

  test('should throw when snippet is missing', async () => {
    const url = 'https://not-existing-snippet.example/'
    const response = await statelessFetch(url)
    await expect(response.text()).rejects.toThrow('missing snippet')

    const statefulFetch = createStatefulFetch()
    const statefulResponse = await statefulFetch(url)
    await expect(statefulResponse.text()).rejects.toThrow('missing snippet')
  })
})

describe('statelessFetch', () => {
  test('should respond with ok for other HTTP PUT', async () => {
    const url = 'https://pro.alice.example/bcbd16fb-23d9-4d9b-867c-e2e69cd94a77'
    const response = await statelessFetch(url, { method: 'PUT' })
    expect(response.ok).toBeTruthy()
  })

  test('should respond with ok for other HTTP methods', async () => {
    const url = 'https://pro.alice.example/bcbd16fb-23d9-4d9b-867c-e2e69cd94a77'
    const response = await statelessFetch(url, { method: 'PATCH' })
    expect(response.ok).toBeTruthy()
  })
})

describe('createFetch', () => {
  test('should set state on PUT and respond with it on GET', async () => {
    const newUrl = 'https://home.alice.example/37f41b0d-696a-4927-9ed3-361e62d92df1'
    const statefulFetch = createFetch()
    const dataset = new Store([
      DataFactory.quad(
        DataFactory.namedNode(newUrl),
        DataFactory.namedNode('https://vocab.example/terms#some'),
        DataFactory.namedNode('https://some.example/'),
        DataFactory.namedNode(newUrl)
      ),
    ])

    const putResponse = await statefulFetch(newUrl, {
      method: 'PUT',
      dataset,
    })
    expect(putResponse.ok).toBeTruthy()

    const getResponse = await statefulFetch(newUrl)
    expect(await getResponse.text()).toMatch('some.example')
  })
})
