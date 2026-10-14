// Configuration Astro du site langitia.com
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  // Adresse publique du site (sert aux liens "canonical" et aux partages)
  site: 'https://langitia.com',

  // Toutes les adresses finissent par / (ex : /cartage/), comme les dossiers du build
  trailingSlash: 'always',

  // React sert uniquement pour le bureau CartageOS (page /cartage)
  integrations: [react()],

  vite: {
    server: {
      // En dev, les appels /api sont envoyés au serveur langitia-api (port 8080)
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  },
});
