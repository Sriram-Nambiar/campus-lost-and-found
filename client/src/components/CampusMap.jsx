import React, { useState, useRef } from 'react';
import { MapPin, X, Eye, EyeOff } from 'lucide-react';
import campusMapImg from '../assets/campus-map.jpg';

// Predefined campus locations mapped to % coordinates on the image
const CAMPUS_LOCATIONS = {
  'Sagar Hospital':         { x: 35, y: 5 },
  'Hospital':               { x: 22, y: 15 },
  'Block 16':               { x: 12, y: 20 },
  'Block 17':               { x: 18, y: 18 },
  'Block 15':               { x: 13, y: 30 },
  'Block 14':               { x: 7,  y: 38 },
  'Block 13':               { x: 13, y: 48 },
  'Block 18':               { x: 28, y: 28 },
  'Block 19':               { x: 28, y: 38 },
  'Block 20':               { x: 27, y: 48 },
  'Block 21':               { x: 35, y: 18 },
  'Block 22':               { x: 42, y: 18 },
  'Block 23':               { x: 55, y: 12 },
  'Block 24':               { x: 62, y: 18 },
  'Block 25':               { x: 58, y: 28 },
  'Heritage Block':         { x: 72, y: 40 },
  'Block 1':                { x: 68, y: 38 },
  'Block 2':                { x: 72, y: 55 },
  'Dr. PG Sagar Auditorium':{ x: 68, y: 62 },
  'Canteen':                { x: 40, y: 38 },
  'Mess':                   { x: 44, y: 42 },
  'Temple':                 { x: 44, y: 48 },
  'Football Ground':        { x: 14, y: 58 },
  'Block 8':                { x: 42, y: 75 },
  'Block 7':                { x: 36, y: 78 },
  'Block 6':                { x: 32, y: 80 },
  'Block 5':                { x: 28, y: 82 },
  'Block 4':                { x: 40, y: 85 },
  'Block 3':                { x: 48, y: 85 },
  'Block 11':               { x: 10, y: 72 },
  'Block 10':               { x: 18, y: 78 },
  'Block 9':                { x: 22, y: 82 },
  'P1 Parking':             { x: 64, y: 32 },
  'Block 26':               { x: 66, y: 26 },
  'Main Library':           { x: 50, y: 38 },
  'Coffee Shop':            { x: 32, y: 50 },
  'Power House':            { x: 38, y: 58 },
  'T1':                     { x: 70, y: 22 },
};

// Fuzzy match a location string to a known campus location
function matchLocation(locationStr) {
  if (!locationStr) return null;
  const lower = locationStr.toLowerCase().trim();

  // Exact match
  for (const [name, coords] of Object.entries(CAMPUS_LOCATIONS)) {
    if (name.toLowerCase() === lower) return { name, ...coords };
  }

  // Partial / contains match
  for (const [name, coords] of Object.entries(CAMPUS_LOCATIONS)) {
    if (lower.includes(name.toLowerCase()) || name.toLowerCase().includes(lower)) {
      return { name, ...coords };
    }
  }

  // Word-level match
  const words = lower.split(/\s+/);
  for (const [name, coords] of Object.entries(CAMPUS_LOCATIONS)) {
    const nameWords = name.toLowerCase().split(/\s+/);
    const overlap = words.some(w => nameWords.some(nw => nw.includes(w) || w.includes(nw)));
    if (overlap) return { name, ...coords };
  }

  return null;
}

const CampusMap = ({ items = [], onSelectItem }) => {
  const [showMap, setShowMap] = useState(true);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const mapRef = useRef(null);

  // Group items by matched location
  const pinGroups = {};
  items.forEach(item => {
    const match = matchLocation(item.location);
    if (match) {
      const key = match.name;
      if (!pinGroups[key]) {
        pinGroups[key] = { ...match, items: [] };
      }
      pinGroups[key].items.push(item);
    }
  });

  const pins = Object.values(pinGroups);

  return (
    <div className="campus-map-section animate-slide-up">
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
          <MapPin size={22} style={{ color: 'var(--accent-primary)' }} />
          Campus Map
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            — {pins.length} active location{pins.length !== 1 ? 's' : ''}
          </span>
        </h2>
        <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setShowMap(!showMap)}>
          {showMap ? <EyeOff size={16} /> : <Eye size={16} />}
          {showMap ? 'Hide' : 'Show'}
        </button>
      </div>

      {showMap && (
        <div className="campus-map-container glass-panel" ref={mapRef}>
          <img
            src={campusMapImg}
            alt="Campus Map"
            className="campus-map-image"
            draggable={false}
            style={{width: "200px%", height:"500px"}}
          />

          {/* Render pins */}
          {pins.map((pin) => {
            const isLost = pin.items.some(i => i.type === 'LOST');
            const isFound = pin.items.some(i => i.type === 'FOUND');
            const pinColor = isLost && isFound ? '#fbbf24' : isLost ? '#f87171' : '#34d399';

            return (
              <div
                key={pin.name}
                className={`map-pin ${selectedPin === pin.name ? 'map-pin-selected' : ''}`}
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  '--pin-color': pinColor,
                }}
                onMouseEnter={() => setHoveredPin(pin.name)}
                onMouseLeave={() => setHoveredPin(null)}
                onClick={() => setSelectedPin(selectedPin === pin.name ? null : pin.name)}
              >
                <div className="map-pin-dot" />
                <div className="map-pin-pulse" />
                <span className="map-pin-count">{pin.items.length}</span>

                {/* Tooltip on hover */}
                {hoveredPin === pin.name && (
                  <div className="map-pin-tooltip">
                    <strong>{pin.name}</strong>
                    <span>{pin.items.length} item{pin.items.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Selected location detail panel */}
          {selectedPin && pinGroups[selectedPin] && (
            <div className="map-detail-panel">
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem' }}>{selectedPin}</h4>
                <button onClick={() => setSelectedPin(null)} style={{ color: 'var(--text-secondary)' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="map-detail-list">
                {pinGroups[selectedPin].items.map(item => (
                  <div key={item.id} className="map-detail-item" onClick={() => onSelectItem && onSelectItem(item)}>
                    <span className={`badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                      {item.type}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.85rem' }}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="map-legend">
            <div className="map-legend-item">
              <span className="map-legend-dot" style={{ background: '#f87171' }}></span>
              Lost
            </div>
            <div className="map-legend-item">
              <span className="map-legend-dot" style={{ background: '#34d399' }}></span>
              Found
            </div>
            <div className="map-legend-item">
              <span className="map-legend-dot" style={{ background: '#fbbf24' }}></span>
              Both
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export location names for the form dropdown
export const LOCATION_NAMES = Object.keys(CAMPUS_LOCATIONS);

export default CampusMap;
