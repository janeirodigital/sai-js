import { fetch } from '../src/fetch-mock'

test('should get parsed data', async () => {
  const url = 'https://alice.example/'
  const dataset = await(fetch(url))
  expect(dataset.size).toBeGreaterThan(0)
  for (const quad of dataset) {
    expect(quad.graph.value).toEqual(url)
  }
})
