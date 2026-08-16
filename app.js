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
    lng: 91.72
  },
  {
    id: 2,
    title: 'R.G. Baruah Road',
    text: 'Waterlogging at the flyover approach. Two-wheelers slow down.',
    name: 'Mitali Sharma',
    time: '28 min ago',
    type: 'caution',
    lat: 26.15,
    lng: 91.80
  },
  {
    id: 3,
    title: 'Majuli ferry ghat',
    text: 'Ferry service paused due to strong current.',
    name: 'Jibon Pegu',
    time: '44 min ago',
    type: 'danger',
    lat: 26.95,
    lng: 94.17
  },
  {
    id: 4,
    title: 'Tezpur–Balipara Road',
    text: 'Road is partially flooded but SUVs are passing.',
    name: 'Rahul Bora',
    time: '1 hr ago',
    type: 'caution',
    lat: 26.63,
    lng: 92.80
  },
  {
    id: 5,
    title: 'GS Road',
    text: 'Road is clear and safe for all vehicles.',
    name: 'Priya Kalita',
    time: '2 hr ago',
    type: 'safe',
    lat: 26.17,
    lng: 91.75
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
let infoWindow;
let directionsService;
let directionsRenderer;
let trafficLayer;
let userMarker;
let originAutocomplete;
let destinationAutocomplete;
let searchAutocomplete;

// ─── Custom map style (matches JolSathi's green/teal aesthetic) ───────────────
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#e6f2e4' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#516b67' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#b5d1ab' }]
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7a9e74' }]
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#d2e7ce' }]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#c8dfc4' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5a7d56' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#b8d8b0' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#f7f4e9' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cfc89f' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#f0ead6' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#c5bb8e' }]
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#c8dfc4' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#91cfdf' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4b9bac' }]
  }
];

// ─── Initialize Map ───────────────────────────────────────────────────────────
function initMap() {
  // Center on Assam
  const assamCenter = { lat: 26.2006, lng: 92.9376 };

  map = new google.maps.Map(document.getElementById('googleMap'), {
    center: assamCenter,
    zoom: 8,
    styles: mapStyle,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    },
    gestureHandling: 'greedy'
  });

  infoWindow = new google.maps.InfoWindow();
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: '#0e706c',
      strokeWeight: 5,
      strokeOpacity: 0.8
    }
  });

  trafficLayer = new google.maps.TrafficLayer();

  // Add flood report markers
  addReportMarkers();

  // Setup Places Autocomplete
  setupAutocomplete();

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
}

// ─── Create custom marker SVG ─────────────────────────────────────────────────
function createMarkerIcon(type) {
  const color = markerColors[type] || markerColors.caution;
  const glyph = markerGlyphs[type] || '!';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 28 18 28s18-15.4 18-28C36 8.06 27.94 0 18 0z" fill="${color}" />
      <circle cx="18" cy="18" r="10" fill="white" opacity="0.3"/>
      <text x="18" y="23" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">${glyph}</text>
    </svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(36, 46),
    anchor: new google.maps.Point(18, 46)
  };
}

// ─── Add Report Markers ───────────────────────────────────────────────────────
function addReportMarkers() {
  reports.forEach(report => {
    const marker = new google.maps.Marker({
      position: { lat: report.lat, lng: report.lng },
      map: map,
      icon: createMarkerIcon(report.type),
      title: report.title,
      animation: google.maps.Animation.DROP,
      optimized: false
    });

    marker.reportData = report;

    marker.addListener('click', () => {
      const statusClass = report.type === 'danger' ? 'iw-danger' : report.type === 'caution' ? 'iw-caution' : 'iw-safe';
      const statusLabel = report.type === 'danger' ? 'Not Safe' : report.type === 'caution' ? 'Caution' : 'Clear';

      infoWindow.setContent(`
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
      `);
      infoWindow.open(map, marker);
      map.panTo(marker.getPosition());
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
        map.panTo(marker.getPosition());
        map.setZoom(13);
        google.maps.event.trigger(marker, 'click');
      }
    });

    list.append(a);
  });
}

// ─── Places Autocomplete ──────────────────────────────────────────────────────
function setupAutocomplete() {
  const searchInput = document.getElementById('placeSearch');
  const originInput = document.getElementById('origin');
  const destinationInput = document.getElementById('destination');

  // Assam bounds for biasing
  const assamBounds = new google.maps.LatLngBounds(
    { lat: 24.0, lng: 89.5 },
    { lat: 28.0, lng: 97.0 }
  );

  const autocompleteOptions = {
    bounds: assamBounds,
    componentRestrictions: { country: 'in' },
    fields: ['place_id', 'geometry', 'name', 'formatted_address']
  };

  // Search bar autocomplete
  searchAutocomplete = new google.maps.places.Autocomplete(searchInput, autocompleteOptions);
  searchAutocomplete.addListener('place_changed', () => {
    const place = searchAutocomplete.getPlace();
    if (place.geometry && place.geometry.location) {
      map.panTo(place.geometry.location);
      map.setZoom(14);
      document.getElementById('mapNotice').textContent = `Showing: ${place.name || place.formatted_address}`;
    }
  });

  // Origin autocomplete
  originAutocomplete = new google.maps.places.Autocomplete(originInput, autocompleteOptions);
  originAutocomplete.addListener('place_changed', () => {
    // origin selected
  });

  // Destination autocomplete
  destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, autocompleteOptions);
  destinationAutocomplete.addListener('place_changed', () => {
    // destination selected
  });
}

// ─── Route Finding ────────────────────────────────────────────────────────────
function setupRouting() {
  document.getElementById('routeButton').addEventListener('click', () => {
    const originInput = document.getElementById('origin');
    const destInput = document.getElementById('destination');
    const origin = originInput.value.trim();
    const destination = destInput.value.trim();
    const notice = document.getElementById('mapNotice');

    if (!destination) {
      destInput.focus();
      return;
    }

    // Handle "Your location" as origin
    let originValue = origin;
    if (origin === 'Your location' || origin === 'আপোনাৰ অৱস্থান' || !origin) {
      if (navigator.geolocation) {
        notice.textContent = 'Getting your location…';
        navigator.geolocation.getCurrentPosition(
          pos => {
            const userLatLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            calculateRoute(userLatLng, destination, notice);
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

    calculateRoute(origin, destination, notice);
  });
}

function calculateRoute(origin, destination, notice) {
  notice.textContent = 'Finding safest route…';

  directionsService.route(
    {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
      region: 'in'
    },
    (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);

        const route = result.routes[0];
        const leg = route.legs[0];
        const hazardCount = countHazardsAlongRoute(route);

        notice.innerHTML = `
          <strong>Route found:</strong> ${leg.start_address.split(',')[0]} → ${leg.end_address.split(',')[0]}
          <br>🕐 ${leg.duration.text} · 📏 ${leg.distance.text}
          ${hazardCount > 0 ? ` · ⚠️ ${hazardCount} reported flood zone${hazardCount > 1 ? 's' : ''} nearby` : ' · ✅ No reported flood zones'}
        `;
        notice.classList.add('route-active');
      } else {
        notice.textContent = 'Could not find a route. Try different locations.';
        notice.classList.remove('route-active');
      }
    }
  );
}

function countHazardsAlongRoute(route) {
  let count = 0;
  const path = route.overview_path;

  reports.forEach(report => {
    if (report.type === 'safe') return;
    const reportPos = new google.maps.LatLng(report.lat, report.lng);

    for (let i = 0; i < path.length; i++) {
      const dist = google.maps.geometry.spherical.computeDistanceBetween(path[i], reportPos);
      if (dist < 5000) { // within 5km of route
        count++;
        break;
      }
    }
  });

  return count;
}

// ─── Geolocation ──────────────────────────────────────────────────────────────
function setupGeolocation() {
  document.getElementById('locateButton').addEventListener('click', () => {
    const notice = document.getElementById('mapNotice');

    if (!navigator.geolocation) {
      notice.textContent = 'Location access unavailable — showing Assam overview';
      return;
    }

    notice.textContent = 'Finding your location…';

    navigator.geolocation.getCurrentPosition(
      pos => {
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        // Remove existing user marker
        if (userMarker) userMarker.setMap(null);

        // Add blue dot marker for user location
        userMarker = new google.maps.Marker({
          position: userPos,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3
          },
          title: 'Your location',
          zIndex: 999
        });

        // Add accuracy circle
        new google.maps.Circle({
          strokeColor: '#4285F4',
          strokeOpacity: 0.2,
          strokeWeight: 1,
          fillColor: '#4285F4',
          fillOpacity: 0.08,
          map: map,
          center: userPos,
          radius: pos.coords.accuracy
        });

        map.panTo(userPos);
        map.setZoom(14);

        // Update origin input
        document.getElementById('origin').value = 'Your location';

        notice.textContent = 'Your location is shown — nearby risks highlighted';

        // Check nearby hazards
        const nearby = reports.filter(r => {
          const dist = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userPos),
            new google.maps.LatLng(r.lat, r.lng)
          );
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
  });
}

// ─── Layer Controls ───────────────────────────────────────────────────────────
let currentLayer = 'flood';
let weatherOverlays = [];

function setupLayerControls() {
  document.querySelectorAll('.map-control').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.map-control.active').classList.remove('active');
      btn.classList.add('active');
      const layer = btn.dataset.layer;
      currentLayer = layer;

      const notice = document.getElementById('mapNotice');

      // Clear layers
      trafficLayer.setMap(null);
      clearWeatherOverlays();

      if (layer === 'flood') {
        // Show flood markers
        markers.forEach(m => m.setMap(map));
        notice.textContent = 'Showing flood-risk reports across Assam';
      } else if (layer === 'roads') {
        // Show traffic layer + markers
        markers.forEach(m => m.setMap(map));
        trafficLayer.setMap(map);
        notice.textContent = 'Showing live traffic and community road-condition updates';
      } else if (layer === 'rain') {
        // Show markers + simulated rainfall zones
        markers.forEach(m => m.setMap(map));
        showRainfallOverlay();
        notice.textContent = 'Showing current rainfall intensity zones';
      }
    });
  });
}

function showRainfallOverlay() {
  // Simulated rainfall intensity zones across Assam
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
    const circle = new google.maps.Circle({
      strokeColor: colors.stroke,
      strokeOpacity: 0.5,
      strokeWeight: 1,
      fillColor: colors.fill,
      fillOpacity: colors.opacity,
      map: map,
      center: { lat: zone.lat, lng: zone.lng },
      radius: zone.radius,
      clickable: false
    });
    weatherOverlays.push(circle);
  });
}

function clearWeatherOverlays() {
  weatherOverlays.forEach(o => o.setMap(null));
  weatherOverlays = [];
}

// ─── Report Hazard Dialog ─────────────────────────────────────────────────────
function setupReportForm() {
  const dialog = document.getElementById('reportDialog');
  const reportBtn = document.getElementById('reportButton');
  const form = document.getElementById('reportForm');

  reportBtn.addEventListener('click', () => dialog.showModal());

  form.addEventListener('submit', e => {
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

      // Geocode the location and add marker
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: location + ', Assam, India' },
        (results, status) => {
          let newLat = 26.2 + (Math.random() - 0.5) * 0.1;
          let newLng = 91.75 + (Math.random() - 0.5) * 0.1;

          if (status === 'OK' && results[0]) {
            newLat = results[0].geometry.location.lat();
            newLng = results[0].geometry.location.lng();
          }

          const newReport = {
            id: reports.length + 1,
            title: location,
            text: details || typeSelect.options[typeSelect.selectedIndex].text,
            name: 'You',
            time: 'Just now',
            type: type,
            lat: newLat,
            lng: newLng
          };

          reports.push(newReport);

          // Add marker
          const marker = new google.maps.Marker({
            position: { lat: newLat, lng: newLng },
            map: map,
            icon: createMarkerIcon(type),
            title: location,
            animation: google.maps.Animation.DROP
          });

          marker.reportData = newReport;

          marker.addListener('click', () => {
            const statusLabel = type === 'danger' ? 'Not Safe' : type === 'caution' ? 'Caution' : 'Clear';
            const statusClass = type === 'danger' ? 'iw-danger' : type === 'caution' ? 'iw-caution' : 'iw-safe';
            infoWindow.setContent(`
              <div class="iw-content ${statusClass}">
                <div class="iw-badge">${statusLabel}</div>
                <h3>${newReport.title}</h3>
                <p>${newReport.text}</p>
                <div class="iw-meta">
                  <span>📍 Just now</span>
                  <span>👤 You</span>
                </div>
                <div class="iw-unverified">⏳ Pending community verification</div>
              </div>
            `);
            infoWindow.open(map, marker);
          });

          markers.push(marker);

          // Re-render sidebar
          renderReports();

          // Update safety score
          updateSafetyScore();

          // Pan to new report
          map.panTo({ lat: newLat, lng: newLng });
          map.setZoom(13);

          // Close dialog
          dialog.close();

          // Show confirmation
          document.getElementById('mapNotice').textContent = `Report submitted: "${location}" — pending community verification`;

          // Reset form
          locationInput.value = '';
          detailsTextarea.value = '';
          typeSelect.selectedIndex = 0;
        }
      );
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

// ─── Dynamic Google Maps API Loading ──────────────────────────────────────────
// Gets the API key securely: from gitignored config.js (local) or /api/maps-config (Vercel)
window.initMap = initMap;

(async function loadGoogleMaps() {
  let apiKey = window.MAPS_API_KEY; // from local config.js (gitignored)

  // If no local key, try fetching from Vercel serverless function
  if (!apiKey) {
    try {
      const res = await fetch('/api/maps-config');
      if (res.ok) {
        const data = await res.json();
        apiKey = data.key;
      }
    } catch (e) {
      // Fetch failed (e.g., running locally without config.js)
    }
  }

  if (!apiKey) {
    console.error('Google Maps API key not found. Create a config.js file or set GOOGLE_MAPS_API_KEY on Vercel.');
    document.getElementById('googleMap').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#e4f1e8;flex-direction:column;gap:12px;padding:20px;text-align:center;">
        <span style="font-size:48px;">🗺️</span>
        <h3 style="margin:0;font-family:'Playfair Display',serif;color:#183b38;">Map Unavailable</h3>
        <p style="margin:0;font-size:13px;color:#647573;max-width:300px;">Google Maps API key not configured. Add your key to <code>config.js</code> for local development or set <code>GOOGLE_MAPS_API_KEY</code> in Vercel environment variables.</p>
      </div>
    `;
    // Still render the sidebar reports
    renderReports();
    return;
  }

  // Dynamically load the Google Maps script
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.error('Failed to load Google Maps API');
    document.getElementById('googleMap').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#e4f1e8;flex-direction:column;gap:12px;padding:20px;text-align:center;">
        <span style="font-size:48px;">⚠️</span>
        <h3 style="margin:0;font-family:'Playfair Display',serif;color:#183b38;">Could not load map</h3>
        <p style="margin:0;font-size:13px;color:#647573;">Check your internet connection and API key configuration.</p>
      </div>
    `;
    renderReports();
  };
  document.head.appendChild(script);
})();
