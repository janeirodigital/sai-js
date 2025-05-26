import { FluentBundle } from '@fluent/bundle'
import { createFluentVue } from 'fluent-vue'

// @ts-ignore
import enMessages from '../locales/en.ftl'

// Create bundles for locales that will be used
const enBundle = new FluentBundle('en')
enBundle.addResource(enMessages)

// Create plugin istance
// bundles - The current negotiated fallback chain of languages
export const fluent = createFluentVue({
  bundles: [enBundle],
})
