# JolSathi — Assam Flood Safety Map

🌊 **Live App:** [https://jolsathi.vercel.app](https://jolsathi.vercel.app/)

Real-time flooding alerts, verified community reports, and safer routes for every journey across Assam. Built by **Kaustav**.

## Tech Stack

- **Map:** [Leaflet](https://leafletjs.com/) + [CartoDB Voyager](https://carto.com/basemaps/) tiles (free, no API key)
- **Routing:** [OSRM](https://project-osrm.org/) — free driving route calculation
- **Search & Geocoding:** [Nominatim](https://nominatim.org/) (OpenStreetMap) — free place search
- **Weather:** [Open-Meteo](https://open-meteo.com/) — free live weather data
- **Hosting:** [Vercel](https://vercel.com/)

No API keys or billing required. Just open `index.html` in a browser or deploy to Vercel.

## Features

- **Interactive map** centered and restricted to Assam with detailed CartoDB Voyager tiles
- **Flood-risk markers** — danger (red), caution (orange), and clear (green) pins at real Assam coordinates
- **Place search** — search any place or road in Assam with live dropdown results
- **Route finding** — calculates driving routes with hazard-zone warnings along the path
- **Photo reports** — upload real-time photos of road conditions with hazard reports
- **Hazards on route** — when a route is found, nearby hazard reports (with photos) are shown in the sidebar
- **Rainfall overlay** — simulated rainfall intensity zones across Assam
- **Geolocation** — auto-detects your location on load and shows nearby hazards
- **Live weather** — real-time temperature, conditions, and rain forecast for your area
- **Community reports** — submit new hazard reports that appear as markers on the map
- **Area safety score** — dynamically updates as reports are added
- **Assamese language support** — full UI translation toggle (অসমীয়া)
- **Responsive design** — works on desktop and mobile

## Important Safety Note

This prototype must not be used as an emergency-navigation authority until its data pipeline, moderation, official-source partnerships, and disclaimer flow are implemented and tested.

## License

This project is proprietary. See `LICENSE`; copying, reuse, modification, or redistribution requires the copyright holder's written permission.
