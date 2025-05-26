import createConfig from '@inrupt/base-rollup-config'
import pkg from './package.json' with { type: 'json' }

export default createConfig(pkg)
