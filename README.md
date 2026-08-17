<div align="center">
  <img src="https://raw.githubusercontent.com/Kaustav333/jolsathi/main/bg.jpg" alt="JolSathi Landscape" width="100%" style="border-radius:12px; margin-bottom: 20px;">
  
  <h1>JolSathi — Assam Flood Safety Network</h1>
  <p><strong>Real-time flood intelligence, verified community reports, and safer dynamic routing across Assam.</strong></p>

  [![Live App](https://img.shields.io/badge/Live_App-JolSathi-10928b?style=for-the-badge&logo=vercel)](https://jolsathi.vercel.app/)
  
  <p><i>Built and designed by <b>Kaustav</b></i></p>
</div>

---

## 📖 Overview

**JolSathi** (meaning *Water Companion*) is a comprehensive, responsive web application designed to help citizens of Assam navigate safely during extreme monsoon and flooding seasons. 

By combining real-time open-source routing, community-driven hazard reporting, and live weather data, JolSathi empowers users to "know the road before they go." The application features a custom glassmorphism UI overlaying a rich, hand-painted landscape of Assam, delivering both critical safety utility and an emotional, localized user experience.

## 🚀 Architecture & Tech Stack

JolSathi is built entirely with vanilla web technologies, ensuring maximum performance and zero build-step overhead, while leveraging powerful open-source APIs.

### Frontend Technologies
*   **HTML5 / CSS3:** Modern, responsive flexbox/grid layouts with advanced CSS features (backdrop-filter for glassmorphism, CSS variables for theming).
*   **Vanilla JavaScript (ES6+):** Asynchronous API fetching, DOM manipulation, and dynamic state management without heavy frameworks.

### Mapping & Geo-Data APIs (100% Free & Open-Source)
*   **[Leaflet.js](https://leafletjs.com/):** The leading open-source JavaScript library for mobile-friendly interactive maps.
*   **[CartoDB Voyager](https://carto.com/basemaps/):** High-performance map tiles providing exceptional detail, clean road networks, and modern aesthetics tailored for data visualization.
*   **[OSRM (Open Source Routing Machine)](https://project-osrm.org/):** High-performance routing engine for shortest paths in road networks. Used to calculate safe driving routes.
*   **[Nominatim (OpenStreetMap)](https://nominatim.org/):** Provides place autocomplete, forward geocoding (address to coordinates), reverse geocoding, and geographical boundary GeoJSON data.
*   **[Open-Meteo](https://open-meteo.com/):** Free, open-source weather API providing live temperature, localized rain probabilities, and condition monitoring.

---

## ✨ Core Features

### 🗺️ Dynamic Routing & Hazard Detection
*   **OSRM Integration:** Calculates precise driving routes between user-defined locations or GPS coordinates.
*   **Proximity Alert System:** Cross-references the calculated route polyline against the database of community hazard reports. Any hazards within a defined radius of the route are automatically highlighted with bouncing animations and extracted to the sidebar.
*   **Area Boundaries:** When searching for a specific city or region, Nominatim returns the exact geographical polygon (GeoJSON), which is dynamically drawn onto the map with a glowing, translucent boundary to highlight the region.

### ⚠️ Community Reporting System
*   **Interactive Hazard Submission:** Users can submit reports directly to the map. Supports three severity tiers: Danger (Red), Caution (Orange), and Clear (Green).
*   **Photo Attachments:** Integrated FileReader API allows users to attach photos to their hazard reports, which are base64-encoded and displayed within the map popup.
*   **Dynamic Safety Score:** An algorithmic "Area Safety Score" out of 100 dynamically recalculates in real-time as new hazards are added, updating both the numerical score and the safety advisory text.

### 🎨 UI / UX Philosophy
*   **Glassmorphism:** The interface utilizes `backdrop-filter: blur()` to create frosted glass panels. This allows the beautiful, custom landscape illustration of Assam (set as a fixed `body` background) to shine through the application interface.
*   **Localized Context:** The map is bounded specifically to Assam using `L.latLngBounds`, preventing users from panning into irrelevant global areas.
*   **Assamese Localization:** A built-in translation dictionary and UI toggle instantly switches the entire interface between English and Assamese (অসমীয়া), ensuring maximum accessibility for local demographics.
*   **Responsive Dashboard:** Fluid grid layouts ensure the map and sidebar stack perfectly on mobile devices while maintaining the aesthetic integrity of the desktop view.

---

## 🛠️ Local Development

Because JolSathi relies entirely on open-source APIs with no API keys required, running the project locally is incredibly simple.

1. Clone the repository.
2. Open `index.html` in any modern web browser.
*(No `npm install`, build steps, or `.env` configurations required).*

## 🔒 License & Usage

This prototype is proprietary. See `LICENSE`. Copying, reuse, modification, or redistribution requires the copyright holder's written permission. 

> **Important Safety Note:** This prototype must not be used as an emergency-navigation authority until its data pipeline, moderation capabilities, official-source partnerships, and disclaimer flows are fully implemented and stress-tested.
