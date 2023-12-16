/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Types
import type { App } from 'vue';

// Plugins
import { loadFonts } from './webfontloader';
import vuetify from './vuetify';
import { fluent } from './fluent';
import pinia from '../store';
import router from '../router';

export function registerPlugins(app: App) {
  loadFonts();
  app.use(vuetify).use(fluent).use(router).use(pinia);
}
