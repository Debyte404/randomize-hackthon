# NexusOS Deployment Guide

This folder contains the production-ready version of the Shadow Intern project, optimized for deployment on Vercel, Render, and itch.io.

## Quick Start

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Build the project**:
    ```bash
    npm run build
    ```
3.  **Preview locally**:
    ```bash
    npm run preview
    ```

## Deployment Options

### 1. Vercel (Recommended for Frontend)
- Install Vercel CLI: `npm i -g vercel`
- Run `vercel` in this directory.
- Vercel will automatically detect the Vite project and use `vercel.json` for routing.

### 2. Render
- Push this folder to a GitHub repository.
- Create a new **Static Site** on Render.
- Connect your repository.
- Render will use the `render.yaml` configuration (if you use a Blueprint) or you can manually set:
    - **Build Command**: `npm install && npm run build`
    - **Publish Directory**: `dist`

### 3. itch.io (HTML5 Game)
- Run the packaging script:
    ```bash
    npm run zip-itch
    ```
- This will generate `production-itch.zip`.
- Upload this zip to your itch.io project page.
- Select "This file will be played in the browser".

## Production Optimizations
- **SEO**: Basic meta tags added to `index.html`.
- **Performance**: Vite's default production build handles tree-shaking and asset hashing.
- **SPA Routing**: Configured via `vercel.json` and `render.yaml`.
