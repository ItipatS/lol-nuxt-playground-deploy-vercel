# League Profile Graph

An interactive **League of Legends profile explorer** built with **Nuxt 4, TypeScript, and Tailwind CSS**.  
The app visualizes player match history and champion usage through an **interactive graph interface**, allowing users to explore gameplay patterns quickly.

Live Demo:  
https://lol-nuxt-playground-deploy-vercel.vercel.app/

---

## Overview

This project demonstrates how to build a **modern full-stack Nuxt application** with:

- Serverless API routes
- External REST API integration
- Batched data fetching
- Interactive data visualization
- Responsive UI design

The application fetches player data from the **Riot Games API**, processes match history, and renders an interactive **champion graph** using **D3.js**.

---

## Features

- Search League players by **Riot ID**
- Fetch player profile and match history via **Riot API**
- **Infinite scroll** match history loading
- Expandable match details with full scoreboard
- Interactive **champion graph visualization**
- Champion usage statistics and winrate display
- Responsive layout with sidebar navigation
- Loading states and error handling
- Secure API key management using **serverless functions**

---

## Tech Stack

Frontend

- **Nuxt 4 (Vue 3)**
- **TypeScript**
- **Tailwind CSS**
- **D3.js** for graph visualization

Backend / Data

- **Nuxt server API routes**
- **Riot Games REST API**
- JSON data processing

Deployment

- **Vercel**
- Environment variables for secure API keys

---

## Architecture

The application uses a **hybrid frontend + serverless architecture**.

Client

- Vue reactive state manages UI and data flow
- Components handle match history, graph rendering, and interactions
- D3 force simulation renders champion relationship graph

Server (Nuxt API routes)

- Riot API requests are proxied through server routes
- API keys remain hidden in environment variables
- Endpoints normalize Riot API responses for frontend usage

Data Flow

---

## Performance Considerations

To keep the UI responsive when loading large match histories:

- Matches are fetched **in batches**
- **Infinite scroll** loads additional data only when needed
- Match detail requests are processed concurrently
- Failed requests are handled gracefully without breaking UI state

---

## Visualization

Champion usage is visualized using a **force-directed graph** built with **D3.js**.

Graph design:

- Player is the center node
- Each champion becomes a node
- Node size represents **games played**
- Edge thickness represents **usage frequency**
- Node ring color represents **win rate**

This allows users to quickly see:

- most played champions
- performance patterns
- champion distribution

---

## What I Learned

This project helped me explore:

- Building full applications with **Nuxt 4**
- Designing **data-driven interactive UI**
- Integrating external APIs securely
- Managing asynchronous UI state
- Using **D3.js** for dynamic visualization

---

## Future Improvements

Potential improvements include:

- Champion filters and search
- Role / lane analysis
- Match timeline visualization
- Player comparison view
- WebSocket live game integration

---

## License

MIT