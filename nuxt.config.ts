/// <reference types="node" />
export default defineNuxtConfig({
  devtools: { enabled: true },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  runtimeConfig: {
    riotApiKey: process.env.RIOT_API_KEY,
  },

  css: ['~/assets/css/main.css'],

  app: {  
    head: { titleTemplate: '%s - LoL Profile Graph', 
      link:[ {rel: 'icon', 
              type: 'image/png',
              href: '/poro.png'
            } 
          ],
      meta: [
        {
          name: 'description',
          content: 'Matches history of searched player with the graph visualizes a player’s recent champion pool.'
        },

        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Riot Match History & Graph Visualizes champion pool' },
        {
          property: 'og:description',
          content: 'Matches history of searched player with the graph visualizes a player’s recent champion pool.'
        },
        { property: 'og:url', content: 'https://lol-nuxt-playground-deploy-vercel.vercel.app/' },
        {
          property: 'og:image',
          content: 'https://lol-nuxt-playground-deploy-vercel.vercel.app/og-preview.png'
        },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Riot Match History & Graph Visualizes champion pool' },
        {
          name: 'twitter:description',
          content: 'Matches history of searched player with the graph visualizes a player’s recent champion pool.'
        },
        {
          name: 'twitter:image',
          content: 'https://lol-nuxt-playground-deploy-vercel.vercel.app/og-preview.png'
        }
      ]
    } 
  },
})