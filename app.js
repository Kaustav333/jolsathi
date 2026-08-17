// ─── Flood Report Data (real Assam coordinates) ───────────────────────────────
const reports = [
  {
    id: 1,
    title: 'NH 27 near Chandrapur',
    text: 'Water above knee level. Small cars cannot cross.',
    name: 'Anup Das',
    time: '12 min ago',
    type: 'danger',
    lat: 26.18,
    lng: 91.72,
    photo: null
  },
  {
    id: 2,
    title: 'R.G. Baruah Road',
    text: 'Waterlogging at the flyover approach. Two-wheelers slow down.',
    name: 'Mitali Sharma',
    time: '28 min ago',
    type: 'caution',
    lat: 26.15,
    lng: 91.80,
    photo: null
  },
  {
    id: 3,
    title: 'Majuli ferry ghat',
    text: 'Ferry service paused due to strong current.',
    name: 'Jibon Pegu',
    time: '44 min ago',
    type: 'danger',
    lat: 26.95,
    lng: 94.17,
    photo: null
  },
  {
    id: 4,
    title: 'Tezpur–Balipara Road',
    text: 'Road is partially flooded but SUVs are passing.',
    name: 'Rahul Bora',
    time: '1 hr ago',
    type: 'caution',
    lat: 26.63,
    lng: 92.80,
    photo: null
  },
  {
    id: 5,
    title: 'GS Road',
    text: 'Road is clear and safe for all vehicles.',
    name: 'Priya Kalita',
    time: '2 hr ago',
    type: 'safe',
    lat: 26.17,
    lng: 91.75,
    photo: null
  }
];

// ─── Marker icon colors ──────────────────────────────────────────────────────
const markerColors = {
  danger: '#e64c42',
  caution: '#eea338',
  safe: '#2ab58a'
};

const markerGlyphs = {
  danger: '!',
  caution: '!',
  safe: '✓'
};

// ─── Globals ──────────────────────────────────────────────────────────────────
let map;
let markers = [];
let userMarker;
let userAccuracyCircle;
let routingControl;
let currentRouteLayer;
let rainfallOverlays = [];
let searchTimeout;

// ─── Assam bounds for restricting the map ─────────────────────────────────────
const assamBounds = L.latLngBounds(
  L.latLng(24.0, 89.5),   // Southwest corner
  L.latLng(28.0, 97.0)    // Northeast corner
);

// ─── Create custom marker icon (SVG) ──────────────────────────────────────────
function createMarkerIcon(type) {
  const color = markerColors[type] || markerColors.caution;
  const glyph = markerGlyphs[type] || '!';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 28 18 28s18-15.4 18-28C36 8.06 27.94 0 18 0z" fill="${color}" />
      <circle cx="18" cy="18" r="10" fill="white" opacity="0.3"/>
      <text x="18" y="23" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">${glyph}</text>
    </svg>`;
  return L.icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -46]
  });
}

// ─── Initialize Map ───────────────────────────────────────────────────────────
function initMap() {
  const assamCenter = [26.2006, 92.9376];

  map = L.map('leafletMap', {
    center: assamCenter,
    zoom: 8,
    maxBounds: assamBounds.pad(0.3), // Restrict panning to Assam (with some padding)
    maxBoundsViscosity: 0.8,         // Make the bounds "sticky"
    minZoom: 7,
    zoomControl: false
  });

  // Add zoom control to the right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '',
    maxZoom: 19
  }).addTo(map);

  // Fetch live weather for Guwahati (default)
  fetchWeather(26.1445, 91.7362, 'Guwahati, Assam');

  // Add flood report markers
  addReportMarkers();

  // Setup search
  setupSearch();

  // Setup route finding
  setupRouting();

  // Setup geolocation
  setupGeolocation();

  // Setup layer controls
  setupLayerControls();

  // Setup report form
  setupReportForm();

  // Render sidebar report list
  renderReports();

  // Keyboard shortcut
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      document.getElementById('placeSearch').focus();
    }
  });

  // Automatically request location and update weather on load
  triggerGeolocation();
}

// ─── Add Report Markers ───────────────────────────────────────────────────────
function addReportMarkers() {
  reports.forEach(report => {
    const marker = L.marker([report.lat, report.lng], {
      icon: createMarkerIcon(report.type),
      title: report.title
    }).addTo(map);

    marker.reportData = report;

    const statusClass = report.type === 'danger' ? 'iw-danger' : report.type === 'caution' ? 'iw-caution' : 'iw-safe';
    const statusLabel = report.type === 'danger' ? 'Not Safe' : report.type === 'caution' ? 'Caution' : 'Clear';

    marker.bindPopup(`
      <div class="iw-content ${statusClass}">
        <div class="iw-badge">${statusLabel}</div>
        <h3>${report.title}</h3>
        <p>${report.text}</p>
        <div class="iw-meta">
          <span>📍 ${report.time}</span>
          <span>👤 ${report.name}</span>
        </div>
        <div class="iw-verified">✓ Verified by community</div>
      </div>
    `, { maxWidth: 280, className: 'custom-popup' });

    marker.on('click', () => {
      map.panTo(marker.getLatLng());
    });

    markers.push(marker);
  });
}

// ─── Render Sidebar Reports ───────────────────────────────────────────────────
const list = document.getElementById('reportList');
const template = document.getElementById('reportTemplate');

function renderReports() {
  list.innerHTML = '';
  reports.forEach(r => {
    const n = template.content.cloneNode(true);
    const a = n.querySelector('.report');
    a.classList.add(r.type);
    a.querySelector('strong').textContent = r.title;
    a.querySelector('p').textContent = r.text;
    a.querySelector('time').textContent = r.time;
    a.querySelector('.reporter').textContent = 'Reported by ' + r.name;

    // Click sidebar report → pan to marker on map
    a.style.cursor = 'pointer';
    a.addEventListener('click', () => {
      const marker = markers.find(m => m.reportData && m.reportData.id === r.id);
      if (marker && map) {
        map.setView(marker.getLatLng(), 13);
        marker.openPopup();
      }
    });

    list.append(a);
  });
}

// ─── Nominatim Search (free, no API key) ──────────────────────────────────────
function setupSearch() {
  const searchInput = document.getElementById('placeSearch');
  const resultsDiv = document.getElementById('searchResults');

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    if (query.length < 3) {
      resultsDiv.style.display = 'none';
      return;
    }
    searchTimeout = setTimeout(() => nominatimSearch(query, resultsDiv, (lat, lng, name) => {
      map.setView([lat, lng], 14);
      document.getElementById('mapNotice').textContent = `Showing: ${name}`;
      resultsDiv.style.display = 'none';
      searchInput.value = name;
    }), 400);
  });

  // Close results when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.style.display = 'none';
    }
  });
}

async function nominatimSearch(query, resultsDiv, onSelect) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Assam, India')}&limit=5&countrycodes=in&viewbox=89.5,24.0,97.0,28.0&bounded=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await res.json();

    if (data.length === 0) {
      resultsDiv.innerHTML = '<div class="search-item" style="color:#9aa9a6;">No results found</div>';
      resultsDiv.style.display = 'block';
      return;
    }

    resultsDiv.innerHTML = '';
    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'search-item';
      div.textContent = item.display_name.split(',').slice(0, 3).join(',');
      div.addEventListener('click', () => {
        onSelect(parseFloat(item.lat), parseFloat(item.lon), item.display_name.split(',').slice(0, 2).join(','));
      });
      resultsDiv.appendChild(div);
    });
    resultsDiv.style.display = 'block';
  } catch (err) {
    console.error('Nominatim search failed:', err);
  }
}

// ─── Geocode a place name to coordinates using Nominatim ──────────────────────
async function geocodePlace(query) {
  try {
    const searchQuery = query.toLowerCase().includes('assam') ? query : query + ', Assam, India';
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
    }
    return null;
  } catch (err) {
    console.error('Geocoding failed:', err);
    return null;
  }
}

// ─── Reverse geocode coordinates to city name using Nominatim ─────────────────
async function getCityName(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
      const state = data.address.state || '';
      return city ? `${city}, ${state}` : (state || 'Your area');
    }
    return 'Your area';
  } catch (err) {
    return 'Your area';
  }
}

// ─── Route Finding (OSRM — free, no key needed) ──────────────────────────────
function setupRouting() {
  document.getElementById('routeButton').addEventListener('click', async () => {
    const originInput = document.getElementById('origin');
    const destInput = document.getElementById('destination');
    const origin = originInput.value.trim();
    const destination = destInput.value.trim();
    const notice = document.getElementById('mapNotice');

    if (!destination) {
      destInput.focus();
      notice.textContent = 'Please enter a destination.';
      return;
    }

    // Handle "Your location" as origin
    if (origin === 'Your location' || origin === 'আপোনাৰ অৱস্থান' || !origin) {
      if (navigator.geolocation) {
        notice.textContent = 'Getting your location…';
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const userLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);
            await calculateRoute(userLatLng, destination, notice);
          },
          () => {
            notice.textContent = 'Could not get location. Please enter an origin.';
            originInput.value = '';
            originInput.focus();
          }
        );
        return;
      } else {
        notice.textContent = 'Location not available. Please enter an origin.';
        originInput.value = '';
        originInput.focus();
        return;
      }
    }

    // Geocode the origin
    notice.textContent = 'Finding route…';
    const originGeo = await geocodePlace(origin);
    if (!originGeo) {
      notice.textContent = 'Could not find origin location. Try a different name.';
      showRouteError();
      return;
    }

    await calculateRoute(L.latLng(originGeo.lat, originGeo.lng), destination, notice);
  });
}

async function calculateRoute(originLatLng, destination, notice) {
  notice.textContent = 'Finding safest route…';

  // Geocode destination
  const destGeo = await geocodePlace(destination);
  if (!destGeo) {
    notice.textContent = 'Could not find destination. Try a different name.';
    showRouteError();
    return;
  }

  const destLatLng = L.latLng(destGeo.lat, destGeo.lng);

  // Remove previous route
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
  if (currentRouteLayer) {
    map.removeLayer(currentRouteLayer);
    currentRouteLayer = null;
  }

  try {
    // Use OSRM free API for routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLatLng.lng},${originLatLng.lat};${destLatLng.lng},${destLatLng.lat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(osrmUrl);
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      notice.textContent = 'Could not find a route. Try different locations.';
      showRouteError();
      return;
    }

    const route = data.routes[0];
    const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); // [lng,lat] → [lat,lng]

    // Draw the route on the map
    currentRouteLayer = L.polyline(coords, {
      color: '#0e706c',
      weight: 6,
      opacity: 0.8
    }).addTo(map);

    // Fit map to route
    map.fitBounds(currentRouteLayer.getBounds().pad(0.1));

    // Calculate duration and distance
    const durationMin = Math.round(route.duration / 60);
    const distKm = (route.distance / 1000).toFixed(1);
    const durationText = durationMin >= 60 ? `${Math.floor(durationMin / 60)} hr ${durationMin % 60} min` : `${durationMin} min`;

    // Check hazards along route
    const hazardCount = countHazardsAlongRoute(coords);

    const originName = document.getElementById('origin').value.split(',')[0];
    const destName = document.getElementById('destination').value.split(',')[0];

    notice.innerHTML = `
      <strong>Route found:</strong> ${originName} → ${destName}
      <br>🕐 ${durationText} · 📏 ${distKm} km
      ${hazardCount > 0 ? ` · ⚠️ ${hazardCount} reported flood zone${hazardCount > 1 ? 's' : ''} nearby` : ' · ✅ No reported flood zones'}
    `;
    notice.classList.add('route-active');

  } catch (err) {
    console.error('Routing error:', err);
    notice.textContent = 'Routing failed. Please try again.';
    showRouteError();
  }
}

function showRouteError() {
  const btn = document.getElementById('routeButton');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Route not found';
  btn.style.background = '#e64c42';
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = '';
  }, 3000);
}

// ─── Distance calculation helper (Haversine) ──────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Count and highlight hazards along route ──────────────────────────────────
function countHazardsAlongRoute(routeCoords) {
  let count = 0;
  const hazardsOnRoute = [];

  markers.forEach(marker => {
    const report = marker.reportData;
    if (!report || report.type === 'safe') return;

    const reportLat = report.lat;
    const reportLng = report.lng;
    let isOnRoute = false;

    // Check every 5th point of route for performance
    for (let i = 0; i < routeCoords.length; i += 5) {
      const dist = haversineDistance(routeCoords[i][0], routeCoords[i][1], reportLat, reportLng);
      if (dist < 5000) { // within 5km
        isOnRoute = true;
        break;
      }
    }

    if (isOnRoute) {
      count++;
      hazardsOnRoute.push(report);

      // Make the marker "bounce" by briefly enlarging it
      const originalIcon = marker.getIcon();
      const bigIcon = createMarkerIcon(report.type);
      bigIcon.options.iconSize = [48, 60];
      bigIcon.options.iconAnchor = [24, 60];
      marker.setIcon(bigIcon);
      marker.setZIndexOffset(1000);

      setTimeout(() => {
        marker.setIcon(originalIcon);
        marker.setZIndexOffset(0);
      }, 4000);
    }
  });

  // Render hazards in sidebar
  const container = document.getElementById('routeHazardsContainer');
  if (container) {
    if (hazardsOnRoute.length > 0) {
      container.style.display = 'block';
      let html = '<p class="section-label" style="margin-top:20px;">HAZARDS ON ROUTE</p>';
      hazardsOnRoute.forEach(h => {
        const photoHtml = h.photo ? `<img src="${h.photo}" style="width:100%; height:140px; object-fit:cover; border-radius:6px; margin-top:8px; border:1px solid #d8e1dc;" />` : '';
        const borderColor = h.type === 'danger' ? '#e64c42' : '#eea338';
        const bgColor = h.type === 'danger' ? '#fdf2f1' : '#fef9f1';

        html += `
          <div style="background:${bgColor}; border-left:4px solid ${borderColor}; padding:12px; margin-bottom:10px; border-radius:4px;">
            <strong style="display:block; font-size:14px; color:#193131;">${h.title}</strong>
            <p style="font-size:12px; color:#5c6b6a; margin:4px 0 0 0; line-height:1.4;">${h.text}</p>
            ${photoHtml}
            <div style="font-size:10px; color:#81908d; margin-top:8px;">📍 ${h.time} &nbsp;•&nbsp; 👤 ${h.name}</div>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  }

  return count;
}

// ─── Live Weather (Open-Meteo API — free, no key needed) ─────────────────────
const weatherIcons = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌧️', 55: '🌧️',
  56: '🌨️', 57: '🌨️',
  61: '🌦️', 63: '🌧️', 65: '🌧️',
  66: '🌨️', 67: '🌨️',
  71: '🌨️', 73: '❄️', 75: '❄️', 77: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

const weatherDescriptions = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snowfall', 73: 'Moderate snowfall', 75: 'Heavy snowfall', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
};

async function fetchWeather(lat, lng, locationName) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto&forecast_hours=6`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const icon = weatherIcons[code] || '☁️';
    const description = weatherDescriptions[code] || 'Unknown';

    // Check upcoming hours for rain
    let rainForecast = '';
    if (data.hourly && data.hourly.precipitation_probability) {
      const probs = data.hourly.precipitation_probability.slice(0, 6);
      const maxProb = Math.max(...probs);
      const maxIndex = probs.indexOf(maxProb);

      if (maxProb >= 70) {
        rainForecast = `Heavy rain likely<br>next ${maxIndex + 1} hour${maxIndex > 0 ? 's' : ''}`;
      } else if (maxProb >= 40) {
        rainForecast = `Rain possible (${maxProb}%)<br>next ${maxIndex + 1} hour${maxIndex > 0 ? 's' : ''}`;
      } else {
        rainForecast = `Low rain chance<br>next 6 hours`;
      }
    }

    // Update weather card
    document.getElementById('weatherIcon').textContent = icon;
    document.getElementById('weatherTemp').textContent = `${temp}°`;
    document.getElementById('weatherLocation').textContent = locationName || 'Your area';
    document.getElementById('weatherForecast').innerHTML = rainForecast || `${description}`;

    // Update "Updated just now" timestamp
    const updatedEl = document.querySelector('.updated');
    if (updatedEl) {
      const now = new Date();
      updatedEl.textContent = `Updated ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  } catch (err) {
    console.error('Weather fetch failed:', err);
    document.getElementById('weatherIcon').textContent = '☁';
    document.getElementById('weatherTemp').textContent = '--°';
    document.getElementById('weatherLocation').textContent = locationName || 'Weather unavailable';
    document.getElementById('weatherForecast').innerHTML = 'Could not load<br>weather data';
  }
}

// ─── Geolocation ──────────────────────────────────────────────────────────────
function triggerGeolocation() {
  const notice = document.getElementById('mapNotice');

  if (!navigator.geolocation) {
    notice.textContent = 'Location access unavailable — showing Assam overview';
    return;
  }

  notice.textContent = 'Finding your location…';

  navigator.geolocation.getCurrentPosition(
    pos => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      // Remove existing user marker
      if (userMarker) map.removeLayer(userMarker);
      if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);

      // Add blue dot marker for user location
      const blueIcon = L.divIcon({
        className: 'user-location-dot',
        html: '<div style="width:20px;height:20px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(66,133,244,0.4);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      userMarker = L.marker([userLat, userLng], {
        icon: blueIcon,
        zIndexOffset: 999,
        title: 'Your location'
      }).addTo(map);

      userMarker.bindPopup('📍 Your current location');

      // Add accuracy circle
      userAccuracyCircle = L.circle([userLat, userLng], {
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.2,
        radius: pos.coords.accuracy
      }).addTo(map);

      map.setView([userLat, userLng], 14);

      // Origin input stays empty — placeholder shows "Your location"
      // If user clicks route without typing, it auto-uses their GPS location

      notice.textContent = 'Your location is shown — nearby risks highlighted';

      // Update weather for user's actual location
      getCityName(userLat, userLng).then(cityName => {
        fetchWeather(userLat, userLng, cityName);
      });

      // Check nearby hazards
      const nearby = reports.filter(r => {
        const dist = haversineDistance(userLat, userLng, r.lat, r.lng);
        return dist < 10000 && r.type !== 'safe';
      });

      if (nearby.length > 0) {
        notice.textContent = `Your location shown — ${nearby.length} hazard${nearby.length > 1 ? 's' : ''} within 10km`;
      }
    },
    () => {
      notice.textContent = 'Location access denied — showing Assam overview';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function setupGeolocation() {
  document.getElementById('locateButton').addEventListener('click', triggerGeolocation);
}

// ─── Layer Controls ───────────────────────────────────────────────────────────
let currentLayer = 'flood';

function setupLayerControls() {
  document.querySelectorAll('.map-control').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.map-control.active').classList.remove('active');
      btn.classList.add('active');
      const layer = btn.dataset.layer;
      currentLayer = layer;

      const notice = document.getElementById('mapNotice');

      // Clear overlays
      clearRainfallOverlays();

      if (layer === 'flood') {
        markers.forEach(m => m.addTo(map));
        notice.textContent = 'Showing flood-risk reports across Assam';
      } else if (layer === 'roads') {
        markers.forEach(m => m.addTo(map));
        notice.textContent = 'Showing road status and community reports';
      } else if (layer === 'rain') {
        markers.forEach(m => m.addTo(map));
        showRainfallOverlay();
        notice.textContent = 'Showing current rainfall intensity zones';
      }
    });
  });
}

function showRainfallOverlay() {
  const rainfallZones = [
    { lat: 26.18, lng: 91.75, radius: 15000, intensity: 'heavy' },
    { lat: 26.63, lng: 92.80, radius: 12000, intensity: 'moderate' },
    { lat: 26.95, lng: 94.17, radius: 18000, intensity: 'heavy' },
    { lat: 27.48, lng: 94.88, radius: 10000, intensity: 'light' },
    { lat: 25.57, lng: 91.88, radius: 14000, intensity: 'moderate' },
    { lat: 24.83, lng: 92.80, radius: 11000, intensity: 'light' }
  ];

  const intensityColors = {
    heavy: { fill: '#1a73e8', stroke: '#1557b0', opacity: 0.25 },
    moderate: { fill: '#4ecdc4', stroke: '#45b7aa', opacity: 0.2 },
    light: { fill: '#a8e6cf', stroke: '#7bc8a4', opacity: 0.15 }
  };

  rainfallZones.forEach(zone => {
    const colors = intensityColors[zone.intensity];
    const circle = L.circle([zone.lat, zone.lng], {
      color: colors.stroke,
      fillColor: colors.fill,
      fillOpacity: colors.opacity,
      weight: 1,
      opacity: 0.5,
      radius: zone.radius,
      interactive: false
    }).addTo(map);
    rainfallOverlays.push(circle);
  });
}

function clearRainfallOverlays() {
  rainfallOverlays.forEach(o => map.removeLayer(o));
  rainfallOverlays = [];
}

// ─── Report Hazard Dialog ─────────────────────────────────────────────────────
function setupReportForm() {
  const dialog = document.getElementById('reportDialog');
  const reportBtn = document.getElementById('reportButton');
  const form = document.getElementById('reportForm');
  const closeBtn = dialog.querySelector('.close');

  const photoInput = document.getElementById('reportPhotoInput');
  const photoPreviewContainer = document.getElementById('photoPreviewContainer');
  const photoPreview = document.getElementById('photoPreview');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const photoUploadLabel = document.getElementById('photoUploadLabel');

  let hasAttachedPhoto = false;

  reportBtn.addEventListener('click', () => dialog.showModal());

  closeBtn.addEventListener('click', () => {
    dialog.close();
    resetReportForm();
  });

  // Handle photo selection and preview
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        photoPreview.src = e.target.result;
        photoPreviewContainer.style.display = 'block';
        photoUploadLabel.style.display = 'none';
        hasAttachedPhoto = true;
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle photo removal
  removePhotoBtn.addEventListener('click', () => {
    photoInput.value = '';
    photoPreview.src = '';
    photoPreviewContainer.style.display = 'none';
    photoUploadLabel.style.display = 'block';
    hasAttachedPhoto = false;
  });

  function resetReportForm() {
    form.reset();
    photoInput.value = '';
    photoPreview.src = '';
    photoPreviewContainer.style.display = 'none';
    photoUploadLabel.style.display = 'block';
    hasAttachedPhoto = false;
  }

  form.addEventListener('submit', async e => {
    if (e.submitter && e.submitter.value === 'submit') {
      e.preventDefault();

      const locationInput = form.querySelector('input[required]');
      const typeSelect = form.querySelector('select');
      const detailsTextarea = form.querySelector('textarea');

      const location = locationInput.value.trim();
      const hazardType = typeSelect.selectedIndex;
      const details = detailsTextarea.value.trim();

      if (!location) return;

      // Determine report type from selection
      let type = 'caution';
      if (hazardType === 0 || hazardType === 2) type = 'danger';
      else if (hazardType === 3) type = 'safe';

      // Geocode the location using Nominatim
      let newLat = 26.2 + (Math.random() - 0.5) * 0.1;
      let newLng = 91.75 + (Math.random() - 0.5) * 0.1;

      const geo = await geocodePlace(location);
      if (geo) {
        newLat = geo.lat;
        newLng = geo.lng;
      }

      const newReport = {
        id: reports.length + 1,
        title: location,
        text: details || typeSelect.options[typeSelect.selectedIndex].text,
        name: 'You',
        time: 'Just now',
        type: type,
        lat: newLat,
        lng: newLng,
        photo: hasAttachedPhoto ? photoPreview.src : null
      };

      reports.push(newReport);

      // Add marker
      const marker = L.marker([newLat, newLng], {
        icon: createMarkerIcon(type),
        title: location
      }).addTo(map);

      marker.reportData = newReport;

      const statusLabel = type === 'danger' ? 'Not Safe' : type === 'caution' ? 'Caution' : 'Clear';
      const statusClass = type === 'danger' ? 'iw-danger' : type === 'caution' ? 'iw-caution' : 'iw-safe';
      const thisReportHasPhoto = hasAttachedPhoto;

      const photoBadge = thisReportHasPhoto ?
        '<span style="background: #e4f1e8; color: #199178; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">📸 Photo attached</span>' : '';

      marker.bindPopup(`
        <div class="iw-content ${statusClass}">
          <div class="iw-badge">${statusLabel}</div>
          <h3>${newReport.title}</h3>
          <p>${newReport.text}</p>
          <div class="iw-meta" style="flex-wrap: wrap;">
            <span>📍 Just now</span>
            <span>👤 You</span>
            ${photoBadge}
          </div>
          <div class="iw-unverified">⏳ Pending community verification</div>
        </div>
      `, { maxWidth: 280, className: 'custom-popup' });

      markers.push(marker);

      // Re-render sidebar
      renderReports();

      // Update safety score
      updateSafetyScore();

      // Pan to new report
      map.setView([newLat, newLng], 13);

      // Close dialog
      dialog.close();

      // Show confirmation
      document.getElementById('mapNotice').textContent = `Report submitted: "${location}" — pending community verification`;

      // Reset form
      resetReportForm();
    }
  });
}

function updateSafetyScore() {
  const dangerCount = reports.filter(r => r.type === 'danger').length;
  const cautionCount = reports.filter(r => r.type === 'caution').length;
  const total = reports.length;

  const score = Math.max(0, Math.min(100, 100 - (dangerCount * 15) - (cautionCount * 8)));

  const scoreEl = document.querySelector('.score-ring b');
  const labelEl = document.querySelector('.safety-score strong');
  const metaEl = document.querySelector('.safety-score span:last-child');

  if (scoreEl) scoreEl.textContent = score;
  if (labelEl) {
    if (score >= 75) labelEl.textContent = 'Generally safe';
    else if (score >= 50) labelEl.textContent = 'Exercise caution';
    else labelEl.textContent = 'High risk area';
  }
  if (metaEl) metaEl.textContent = `Based on ${total} recent reports`;
}

// ─── Assamese / English translation ──────────────────────────────────────────
const assamese = {
  'Live flood intelligence': 'জীৱন্ত বন্যা তথ্য',
  'Updated just now': 'এতিয়াই আপডেট কৰা হৈছে',
  'ASSAM • COMMUNITY SAFETY NETWORK': 'অসম • সমাজিক সুৰক্ষা নেটৱৰ্ক',
  'Real-time flooding alerts, verified community reports, and safer routes for every journey across Assam.':
    'বাস্তৱ-সময়ৰ বন্যা সতৰ্কবাণী, নিশ্চিত সমাজিক খবৰ আৰু অসমজুৰি সুৰক্ষিত যাত্ৰাপথ।',
  'Guwahati, Assam': 'গুৱাহাটী, অসম',
  'Heavy rain expected': 'প্ৰবল বৰষুণৰ সম্ভাৱনা',
  'next 3 hours': 'আগন্তুক ৩ ঘণ্টাত',
  'Search a place or road': 'ঠাই বা পথ বিচাৰক',
  'PLAN A SAFER TRIP': 'সুৰক্ষিত যাত্ৰা পৰিকল্পনা কৰক',
  'Your location': 'আপোনাৰ অৱস্থান',
  'Where are you going?': "আপুনি ক'লৈ যাব?",
  'Find safest route': 'সকলোতকৈ সুৰক্ষিত পথ বিচাৰক',
  'AREA SAFETY SCORE': "এলেকাৰ সুৰক্ষা স্ক'ৰ",
  'Exercise caution': 'সাৱধানতা অৱলম্বন কৰক',
  'Based on 48 recent reports': '৪৮টা সাম্প্ৰতিক খবৰৰ ভিত্তিত',
  'NEARBY REPORTS': 'ওচৰৰ খবৰ',
  'What people are seeing': 'মানুহে কি দেখিছে',
  Filter: 'ফিল্টাৰ',
  Flooding: 'বানপানী',
  'Road status': 'পথৰ অৱস্থা',
  Rainfall: 'বৰষুণ',
  'Not safe': 'নিৰাপদ নহয়',
  Caution: 'সাৱধান',
  Clear: 'সুৰক্ষিত',
  'Showing flood-risk reports across Assam': 'অসমজুৰি বানপানীৰ বিপদৰ খবৰ দেখুওৱা হৈছে',
  Guwahati: 'গুৱাহাটী',
  Tezpur: 'তেজপুৰ',
  Jorhat: 'যোৰহাট',
  Dibrugarh: 'ডিব্ৰুগড়',
  Silchar: 'শিলচৰ',
  'Brahmaputra River': 'ব্ৰহ্মপুত্ৰ নৈ',
  'Report a hazard': 'বিপদৰ খবৰ দিয়ক',
  'KEEP YOUR COMMUNITY SAFE': 'আপোনাৰ সমাজক সুৰক্ষিত ৰাখক',
  'Report a road hazard': 'পথৰ বিপদৰ খবৰ দিয়ক',
  'Your update will help travellers make safer choices.':
    'আপোনাৰ খবৰে যাত্ৰীসকলক সুৰক্ষিত সিদ্ধান্ত লোৱাত সহায় কৰিব।',
  Location: 'অৱস্থান',
  'e.g. NH 27 near Chandrapur': 'যেনে: চন্দ্ৰপুৰৰ ওচৰত এন এইচ ২৭',
  'What did you see?': 'আপুনি কি দেখিলে?',
  'Road flooded / impassable': 'পথ পানীত ডুবি আছে / চলাচল অসম্ভৱ',
  'Waterlogging — pass with care': 'পানী জমা হৈছে — সাৱধানে যাওক',
  'Bridge or road damage': 'দলং বা পথৰ ক্ষতি',
  'Road is clear now': 'পথ এতিয়া সুৰক্ষিত',
  'Details (optional)': 'বিৱৰণ (ঐচ্ছিক)',
  'Water level, landmarks, vehicle access…': 'পানীৰ উচ্চতা, চিনাক্ত ঠাই, গাড়ীৰ চলাচল…',
  'Add a photo': 'ফটো যোগ কৰক',
  'Publish report': 'খবৰ প্ৰকাশ কৰক',
  'NH 27 near Chandrapur': 'চন্দ্ৰপুৰৰ ওচৰত এন এইচ ২৭',
  'Water above knee level. Small cars cannot cross.':
    'আঁঠুলৈকে পানী। সৰু গাড়ী চলাচল কৰিব নোৱাৰে।',
  'Reported by Anup Das': 'অনুপ দাসে জনাইছে',
  'R.G. Baruah Road': 'আৰ.জি. বৰুৱা পথ',
  'Waterlogging at the flyover approach. Two-wheelers slow down.':
    "ফ্লাইঅ'ভাৰৰ ওচৰত পানী জমা হৈছে। দুচকীয়া বাহন লাহে চলাওক।",
  'Reported by Mitali Sharma': 'মিতালী শৰ্মাই জনাইছে',
  'Majuli ferry ghat': 'মাজুলী ফেৰী ঘাট',
  'Ferry service paused due to strong current.':
    'প্ৰবল সোঁতৰ বাবে ফেৰী সেৱা বন্ধ আছে।',
  'Reported by Jibon Pegu': 'জীৱন পেগুৱে জনাইছে',
  'Tezpur–Balipara Road': 'তেজপুৰ–বালিপাৰা পথ',
  'Road is partially flooded but SUVs are passing.':
    'পথ আংশিকভাৱে পানীত ডুবি আছে, কিন্তু এছ ইউ ভিত চলিছে।',
  'Reported by Rahul Bora': 'ৰাহুল বৰাই জনাইছে',
  'Verified by community': 'সমাজে নিশ্চিত কৰিছে',
  '12 min ago': '১২ মিনিট আগতে',
  '28 min ago': '২৮ মিনিট আগতে',
  '44 min ago': '৪৪ মিনিট আগতে',
  '1 hr ago': '১ ঘণ্টা আগতে',
  'NH 27': 'এন এইচ ২৭',
  'R.G. Baruah Rd': 'আৰ.জি. বৰুৱা পথ',
  'Majuli Ferry': 'মাজুলী ফেৰী',
  'GS Road': 'জি এছ পথ',
  'Road is clear and safe for all vehicles.': 'পথ সকলো বাহনৰ বাবে সুৰক্ষিত।',
  'Reported by Priya Kalita': 'প্ৰিয়া কলিতাই জনাইছে',
  '2 hr ago': '২ ঘণ্টা আগতে',
  'Generally safe': 'সাধাৰণতে সুৰক্ষিত',
  'High risk area': 'উচ্চ বিপদৰ এলেকা'
};

const english = Object.fromEntries(
  Object.entries(assamese).map(([key, value]) => [value, key])
);
let usingAssamese = false;

function translateVisible(dictionary) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: n =>
      ['SCRIPT', 'STYLE'].includes(n.parentElement?.tagName)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const parts = node.nodeValue.match(/^(\s*)(.*?)(\s*)$/s);
    if (parts && dictionary[parts[2]]) node.nodeValue = parts[1] + dictionary[parts[2]] + parts[3];
  });
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    if (dictionary[el.placeholder]) el.placeholder = dictionary[el.placeholder];
  });
  document.querySelectorAll('input[value]').forEach(el => {
    if (dictionary[el.value]) el.value = dictionary[el.value];
  });
}

document.getElementById('languageToggle').addEventListener('click', () => {
  usingAssamese = !usingAssamese;
  translateVisible(usingAssamese ? assamese : english);
  document.documentElement.lang = usingAssamese ? 'as' : 'en';
  document.querySelector('.intro h1').innerHTML = usingAssamese
    ? 'পথৰ খবৰ লওক<br><em>যোৱাৰ আগতে।</em>'
    : 'Know the road<br><em>before</em> you go.';
  document.getElementById('languageToggle').textContent = usingAssamese ? 'English' : 'অসমীয়া';
});

// ─── Initialize everything when DOM is ready ──────────────────────────────────
document.addEventListener('DOMContentLoaded', initMap);
