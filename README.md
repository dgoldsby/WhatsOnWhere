# StreamFinder

A web application that aggregates TV and movie listings from various streaming platforms and provides detailed information including IMDB ratings, cast, and availability.

## Features

- Search for movies and TV shows across multiple streaming platforms
- View detailed information including plot summaries, cast, and ratings
- See which platforms currently stream each title
- Filter by genre, release year, and more

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory and add your API keys:
   ```
   NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
   NEXT_PUBLIC_IMDB_API_KEY=your_imdb_api_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- The Movie Database (TMDB) API
- IMDB API (via RapidAPI)
- React Query for data fetching

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - Reusable React components
- `/lib` - Utility functions and API clients
- `/types` - TypeScript type definitions
- `/public` - Static assets
