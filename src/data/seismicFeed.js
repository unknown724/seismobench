/**
 * Seismic Event Data Feed for Global Map and Live Feed Views
 * Formatted with Apple HIG semantic metadata (Magnitude, Depth, Tectonic setting, Coordinates)
 */

export const INITIAL_SEISMIC_FEED = [
  {
    id: 'eq-elcentro-1940',
    title: 'M 6.9 - Imperial Valley (El Centro)',
    magnitude: 6.9,
    location: 'Imperial County, California, USA',
    region: 'North America',
    coordinates: [32.73, -115.50], // [lat, lng]
    depthKm: 16.0,
    timeAgo: 'Historical Benchmark',
    timestamp: '1940-05-18T20:36:00Z',
    pga: 0.348,
    pgv: 36.9,
    status: 'Verified',
    station: 'El Centro Terminal Substation (NS)',
    fault: 'Imperial Fault Zone (Strike-slip)',
    associatedRecordId: 'elcentro',
    summary: 'The classic earthquake record widely utilized to develop response spectrum methods in seismic structural design.'
  },
  {
    id: 'eq-kobe-1995',
    title: 'M 6.9 - Great Hanshin Earthquake (Kobe)',
    magnitude: 6.9,
    location: 'Kobe, Hyogo Prefecture, Japan',
    region: 'East Asia',
    coordinates: [34.58, 135.03],
    depthKm: 17.6,
    timeAgo: 'Historical Benchmark',
    timestamp: '1995-01-17T05:46:52Z',
    pga: 0.820,
    pgv: 104.2,
    status: 'Verified',
    station: 'Kobe JMA Station',
    fault: 'Nojima Fault (Right-lateral strike-slip)',
    associatedRecordId: 'kobe',
    summary: 'Infamous for near-fault velocity pulses and massive civil infrastructure damage across the Hanshin expressway.'
  },
  {
    id: 'eq-northridge-1994',
    title: 'M 6.7 - Northridge Earthquake (Sylmar)',
    magnitude: 6.7,
    location: 'San Fernando Valley, California, USA',
    region: 'North America',
    coordinates: [34.21, -118.54],
    depthKm: 18.2,
    timeAgo: 'Historical Benchmark',
    timestamp: '1994-01-17T12:30:55Z',
    pga: 0.843,
    pgv: 112.5,
    status: 'Verified',
    station: 'Sylmar County Hospital Station',
    fault: 'Northridge Blind Thrust Fault',
    associatedRecordId: 'northridge',
    summary: 'Unprecedented vertical ground accelerations exceeding 1.0g recorded in structural hospital frames.'
  },
  {
    id: 'eq-chile-2010',
    title: 'M 8.8 - Maule Offshore Megathrust',
    magnitude: 8.8,
    location: 'Offshore Biobío, Chile',
    region: 'South America',
    coordinates: [-35.85, -72.72],
    depthKm: 30.1,
    timeAgo: 'Major Megathrust',
    timestamp: '2010-02-27T06:34:14Z',
    pga: 0.650,
    pgv: 82.0,
    status: 'Verified',
    station: 'Concepcion Station',
    fault: 'Nazca - South American Plate Subduction',
    associatedRecordId: 'kobe',
    summary: 'One of the largest megathrust events in modern history, triggering a Pacific-wide tsunami.'
  },
  {
    id: 'eq-tohoku-2011',
    title: 'M 9.1 - Great East Japan Megathrust',
    magnitude: 9.1,
    location: 'Offshore Sendai, Miyagi, Japan',
    region: 'East Asia',
    coordinates: [38.30, 142.37],
    depthKm: 29.0,
    timeAgo: 'Catastrophic',
    timestamp: '2011-03-11T05:46:24Z',
    pga: 0.980,
    pgv: 135.0,
    status: 'Verified',
    station: 'MYG004 K-NET Sendai',
    fault: 'Japan Trench Subduction Zone',
    associatedRecordId: 'kobe',
    summary: 'Massive undersea megathrust generating up to 40m tsunami run-up heights along the Sanriku coast.'
  },
  {
    id: 'eq-turkey-2023',
    title: 'M 7.8 - Kahramanmaras Doublet',
    magnitude: 7.8,
    location: 'Pazarcik, Kahramanmaras, Turkey',
    region: 'Middle East',
    coordinates: [37.17, 37.03],
    depthKm: 14.5,
    timeAgo: 'Recent Event',
    timestamp: '2023-02-06T01:17:34Z',
    pga: 0.720,
    pgv: 95.0,
    status: 'Verified',
    station: 'Antakya Central Station',
    fault: 'East Anatolian Fault (Left-lateral strike-slip)',
    associatedRecordId: 'northridge',
    summary: 'Devastating strike-slip rupture causing catastrophic pancake collapse in unreinforced masonry structures.'
  },
  {
    id: 'eq-taiwan-2024',
    title: 'M 7.4 - Hualien Coastal Rupture',
    magnitude: 7.4,
    location: 'Hualien County, Taiwan',
    region: 'East Asia',
    coordinates: [23.77, 121.67],
    depthKm: 12.0,
    timeAgo: 'Recent Event',
    timestamp: '2024-04-03T07:58:09Z',
    pga: 0.680,
    pgv: 78.4,
    status: 'Verified',
    station: 'HWA Station Hualien',
    fault: 'Longitudinal Valley Fault (Oblique thrust)',
    associatedRecordId: 'kobe',
    summary: 'Strongest earthquake to strike Taiwan in 25 years with high resilience demonstrated by modern building codes.'
  },
  {
    id: 'eq-sweep-synth',
    title: 'Synthetic Sine Sweep (1 Hz - 15 Hz)',
    magnitude: 4.5,
    location: 'Chirp Frequency Vibration Bench',
    region: 'Laboratory Synthetic',
    coordinates: [37.77, -122.41],
    depthKm: 0.0,
    timeAgo: 'Test Protocol',
    timestamp: '2026-09-30T12:00:00Z',
    pga: 0.250,
    pgv: 24.5,
    status: 'Calibrated',
    station: 'ESP32-S3 Hardware Loopback Simulator',
    fault: 'GT2 Dual-Stepper Carriage Bench',
    associatedRecordId: 'sweep',
    summary: 'Continuous 1 to 15 Hz resonant sweep calibrated for identifying carriage and specimen natural modal resonance.'
  }
];

/**
 * Returns Apple HIG semantic colors and labels based on Earthquake Magnitude
 */
export function getMagnitudePalette(mag) {
  if (mag < 4.5) {
    return {
      category: 'Minor',
      color: '#30D158', // Apple Green
      bgGlass: 'rgba(48, 209, 88, 0.12)',
      border: 'rgba(48, 209, 88, 0.35)',
      badgeClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
    };
  } else if (mag < 6.0) {
    return {
      category: 'Moderate',
      color: '#FF9F0A', // Apple Orange
      bgGlass: 'rgba(255, 159, 10, 0.12)',
      border: 'rgba(255, 159, 10, 0.35)',
      badgeClass: 'text-amber-400 bg-amber-950/40 border-amber-500/30'
    };
  } else if (mag < 7.5) {
    return {
      category: 'Severe',
      color: '#FF453A', // Apple Coral/Red
      bgGlass: 'rgba(255, 69, 58, 0.14)',
      border: 'rgba(255, 69, 58, 0.4)',
      badgeClass: 'text-rose-400 bg-rose-950/40 border-rose-500/30'
    };
  } else {
    return {
      category: 'Great',
      color: '#BF5AF2', // Apple Purple/Indigo
      bgGlass: 'rgba(191, 90, 242, 0.16)',
      border: 'rgba(191, 90, 242, 0.45)',
      badgeClass: 'text-purple-400 bg-purple-950/40 border-purple-500/30'
    };
  }
}
