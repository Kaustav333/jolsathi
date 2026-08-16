# JolSathi — Assam Flood Safety Map

Open `index.html` in a browser to use the interactive flood safety map. It is dependency-free (apart from the Google Maps API), so it can be hosted on Vercel, Netlify, or GitHub Pages.

## Setup

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
3. **Restrict your API key** to your domain(s) for security

### 2. Local Development

Create a `config.js` file in the project root (this file is gitignored and will NOT be committed):

```js
window.MAPS_API_KEY = 'your-api-key-here';
```

Then open `index.html` in your browser.

### 3. Vercel Deployment

1. Set the environment variable `GOOGLE_MAPS_API_KEY` in your Vercel project settings
2. Push to GitHub — Vercel will auto-deploy
3. The `/api/maps-config` serverless function will serve the key securely

## Features

- **Real Google Map** centered on Assam with custom aesthetic styling
- **Flood-risk markers** — danger (red), caution (orange), and clear (green) pins at real Assam coordinates
- **Places Autocomplete** — search any place or road with Google Places, biased to Assam
- **Route finding** — uses Google Directions API to find routes with hazard-zone warnings
- **Live traffic layer** — toggle Google's real-time traffic data
- **Rainfall overlay** — simulated rainfall intensity zones across Assam
- **Geolocation** — find your location and see nearby hazards
- **Community reports** — submit new hazard reports that appear as markers on the map
- **Area safety score** — dynamically updates as reports are added
- **Assamese language support** — full UI translation toggle
- **Responsive design** — works on desktop and mobile

## Important safety note

This prototype must not be used as an emergency-navigation authority until its data pipeline, moderation, official-source partnerships, and disclaimer flow are implemented and tested.

## License

This project is proprietary. See `LICENSE`; copying, reuse, modification, or redistribution requires the copyright holder's written permission.
