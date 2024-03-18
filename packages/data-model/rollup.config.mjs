import createConfig from '@inrupt/base-rollup-config';
import pkg from "./package.json" assert { type: "json" };

export default createConfig(pkg)
