import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifestVersion: 3,
  manifest: {
    name: 'GitDeck',
    short_name: 'GitDeck',
    description: 'A curated deck of tools for the GitHub repository you are looking at.',
    permissions: ['activeTab', 'storage'],
    browser_specific_settings: {
      gecko: {
        id: 'gitdeck@shanedixon.dev',
        strict_min_version: '115.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
    action: {
      default_title: 'GitDeck',
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
  },
});
