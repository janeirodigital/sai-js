import { expect, test } from 'vitest'
import { parseJsonld } from '../src'

const snippet = `
{
  "@context": {
    "ical": "http://www.w3.org/2002/12/cal/ical#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "ical:dtstart": {
      "@type": "xsd:dateTime"
    }
  },
  "ical:summary": "Lady Gaga Concert",
  "ical:location": "New Orleans Arena, New Orleans, Louisiana, USA",
  "ical:dtstart": "2011-04-09T20:00:00Z"
}
`

test('should parse json-ld', async () => {
  const source = 'https://some.example/'
  const dataset = await parseJsonld(snippet, source)
  expect(dataset.size).toBe(3)
})

test('uses DefaultGraph is none is provided', async () => {
  const dataset = await parseJsonld(snippet)
  expect(dataset.size).toBeGreaterThan(1)
  for (const quad of dataset) {
    expect(quad.graph.termType).toEqual('DefaultGraph')
  }
})
