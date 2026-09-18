import type { ImageMetadata } from '../types/image';

// Generates an inline SVG data URL for crisp, standalone remote-sensing demonstration imagery
function createDemoSatelliteSvg(type: 'optical_urban' | 'optical_change' | 'sar_radar' | 'multispectral_cir' | 'incompatible'): string {
  let innerElements = '';
  let label = 'DEMO OPTICAL (Sentinel-2 L2A 10m)';

  if (type === 'optical_urban') {
    label = 'DEMO OPTICAL: Coastal Urban and Water Body (10m GSD)';
    innerElements = `
      <defs>
        <pattern id="urbanGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#2d3748" />
          <rect x="2" y="2" width="16" height="16" fill="#4a5568" />
        </pattern>
      </defs>
      <!-- Base terrain -->
      <rect width="800" height="800" fill="#233226" />
      <!-- Water body (estuary/bay) -->
      <path d="M 0,350 Q 250,320 400,480 T 800,520 L 800,800 L 0,800 Z" fill="#0f2b3c" />
      <!-- Agricultural plots -->
      <rect x="40" y="40" width="140" height="90" fill="#2b422a" stroke="#1d2e1c" stroke-width="2" />
      <rect x="200" y="30" width="160" height="120" fill="#385437" stroke="#1d2e1c" stroke-width="2" />
      <rect x="50" y="160" width="180" height="110" fill="#304832" stroke="#1d2e1c" stroke-width="2" />
      <!-- Urban built-up zone -->
      <rect x="420" y="80" width="340" height="360" fill="url(#urbanGrid)" rx="6" opacity="0.9" />
      <!-- Transport arterial highway -->
      <path d="M 40,400 Q 300,380 500,200 T 780,50" stroke="#718096" stroke-width="6" fill="none" stroke-dasharray="8,2" />
      <!-- Secondary roads -->
      <line x1="420" y1="200" x2="760" y2="200" stroke="#a0aec0" stroke-width="3" />
      <line x1="580" y1="80" x2="580" y2="440" stroke="#a0aec0" stroke-width="3" />
      <!-- Industrial harbour docks -->
      <rect x="410" y="470" width="40" height="90" fill="#a0aec0" />
      <rect x="480" y="490" width="35" height="110" fill="#a0aec0" />
      <rect x="550" y="510" width="45" height="95" fill="#a0aec0" />
    `;
  } else if (type === 'optical_change') {
    label = 'DEMO OPTICAL T2: Urban Expansion and Cleared Land';
    innerElements = `
      <defs>
        <pattern id="urbanGridNew" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#394b63" />
          <rect x="2" y="2" width="16" height="16" fill="#5c6f8b" />
        </pattern>
      </defs>
      <!-- Base terrain (dryer season) -->
      <rect width="800" height="800" fill="#2d3424" />
      <!-- Water body -->
      <path d="M 0,350 Q 250,320 400,480 T 800,520 L 800,800 L 0,800 Z" fill="#0d2433" />
      <!-- Former agricultural plots now altered/excavated -->
      <rect x="40" y="40" width="140" height="90" fill="#54493b" stroke="#3d3326" stroke-width="2" />
      <rect x="200" y="30" width="160" height="120" fill="#695b49" stroke="#3d3326" stroke-width="2" />
      <!-- Expanded Urban / Industrial Zone (New development) -->
      <rect x="50" y="160" width="280" height="150" fill="url(#urbanGridNew)" stroke="#f59e0b" stroke-width="3" stroke-dasharray="6,4" />
      <rect x="420" y="80" width="340" height="360" fill="url(#urbanGridNew)" rx="6" opacity="0.9" />
      <!-- Highway extended -->
      <path d="M 40,400 Q 300,380 500,200 T 780,50" stroke="#a0aec0" stroke-width="8" fill="none" />
      <rect x="410" y="470" width="55" height="120" fill="#cbd5e1" />
      <rect x="480" y="490" width="60" height="140" fill="#cbd5e1" />
      <rect x="560" y="510" width="70" height="115" fill="#cbd5e1" />
    `;
  } else if (type === 'sar_radar') {
    label = 'DEMO SAR: Sentinel-1 IW C-Band Amplitude (VV/VH)';
    innerElements = `
      <!-- SAR dark background / high noise floor -->
      <rect width="800" height="800" fill="#0d1117" />
      <!-- Speckle background -->
      <filter id="sarSpeckle">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" result="noise" />
        <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.45 0" />
      </filter>
      <rect width="800" height="800" filter="url(#sarSpeckle)" />
      <!-- Water body: specular reflection = pitch black in SAR -->
      <path d="M 0,350 Q 250,320 400,480 T 800,520 L 800,800 L 0,800 Z" fill="#000205" />
      <!-- Rough vegetation: moderate diffuse scattering -->
      <rect x="40" y="40" width="320" height="230" fill="#2b313a" opacity="0.6" />
      <!-- Urban structures / Dihedral corner reflectors: intense bright white SAR returns -->
      <g fill="#f8fafc" opacity="0.95">
        <rect x="430" y="90" width="8" height="8" />
        <rect x="450" y="100" width="12" height="10" />
        <rect x="490" y="130" width="15" height="14" />
        <rect x="540" y="110" width="20" height="18" />
        <rect x="620" y="160" width="24" height="20" />
        <rect x="670" y="210" width="16" height="18" />
        <rect x="460" y="240" width="28" height="12" />
        <rect x="520" y="280" width="34" height="22" />
        <rect x="590" y="320" width="30" height="25" />
        <rect x="660" y="350" width="22" height="28" />
        <!-- Docks metal cranes: extremely bright -->
        <rect x="415" y="475" width="25" height="60" fill="#ffffff" />
        <rect x="485" y="495" width="25" height="70" fill="#ffffff" />
        <rect x="555" y="515" width="30" height="65" fill="#ffffff" />
      </g>
    `;
  } else if (type === 'multispectral_cir') {
    label = 'DEMO MULTISPECTRAL: False Color Infrared CIR (NIR-R-G)';
    innerElements = `
      <!-- High NIR vegetation glows vibrant red/crimson -->
      <rect width="800" height="800" fill="#6b1d28" />
      <!-- Water absorbs NIR completely = deep blue-black -->
      <path d="M 0,350 Q 250,320 400,480 T 800,520 L 800,800 L 0,800 Z" fill="#040e1a" />
      <!-- Dense chlorophyll plots -->
      <rect x="40" y="40" width="140" height="90" fill="#991b1b" stroke="#450a0a" stroke-width="2" />
      <rect x="200" y="30" width="160" height="120" fill="#b91c1c" stroke="#450a0a" stroke-width="2" />
      <!-- Bare soil / roads appear cyan / gray-silver -->
      <rect x="420" y="80" width="340" height="360" fill="#475569" rx="6" opacity="0.9" />
      <path d="M 40,400 Q 300,380 500,200 T 780,50" stroke="#94a3b8" stroke-width="6" fill="none" />
    `;
  } else {
    label = 'DEMO INCOMPATIBLE RASTER: Remote Scene';
    innerElements = `
      <rect width="800" height="800" fill="#1e1b4b" />
      <circle cx="400" cy="400" r="250" fill="#312e81" opacity="0.7" />
      <text x="400" y="400" text-anchor="middle" fill="#a5b4fc" font-size="20">MODIS TERRA (60m GSD - EPSG:4326)</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    ${innerElements}
    <!-- Telemetry border and calibration overlay -->
    <rect x="10" y="10" width="780" height="780" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.3" />
    <!-- Reticle corner marks -->
    <path d="M 20 50 L 20 20 L 50 20" stroke="#38bdf8" stroke-width="2" fill="none" />
    <path d="M 750 20 L 780 20 L 780 50" stroke="#38bdf8" stroke-width="2" fill="none" />
    <path d="M 20 750 L 20 780 L 50 780" stroke="#38bdf8" stroke-width="2" fill="none" />
    <path d="M 750 780 L 780 780 L 780 750" stroke="#38bdf8" stroke-width="2" fill="none" />
    <!-- Demonstration Watermark and Calibration Banner -->
    <rect x="20" y="745" width="760" height="28" fill="#090d16" opacity="0.85" rx="3" />
    <text x="35" y="764" fill="#94a3b8" font-family="monospace" font-size="12" letter-spacing="1">MOCK DEMO RASTER // ${label}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const MOCK_IMAGES: Record<string, ImageMetadata> = {
  img_s2_optical_t1: {
    image_id: 'img_s2_optical_t1',
    filename: 'S2A_MSIL2A_20240115_T43QDA_OPTICAL.tif',
    modality: 'Optical',
    width: 1024,
    height: 1024,
    bands: 3,
    dtype: 'uint8',
    crs: 'EPSG:32643',
    resolution_x: 10.0,
    resolution_y: 10.0,
    bounds: [72.82, 18.92, 72.95, 19.05],
    transform: [10.0, 0.0, 271200.0, 0.0, -10.0, 2108000.0],
    file_size_bytes: 14205840,
    preview_url: createDemoSatelliteSvg('optical_urban'),
    slot_label: 'Image 1'
  },
  img_s2_optical_t2: {
    image_id: 'img_s2_optical_t2',
    filename: 'S2B_MSIL2A_20240320_T43QDA_OPTICAL.tif',
    modality: 'Optical',
    width: 1024,
    height: 1024,
    bands: 3,
    dtype: 'uint8',
    crs: 'EPSG:32643',
    resolution_x: 10.0,
    resolution_y: 10.0,
    bounds: [72.82, 18.92, 72.95, 19.05],
    transform: [10.0, 0.0, 271200.0, 0.0, -10.0, 2108000.0],
    file_size_bytes: 14210450,
    preview_url: createDemoSatelliteSvg('optical_change'),
    slot_label: 'Image 2'
  },
  img_s1_sar_t1: {
    image_id: 'img_s1_sar_t1',
    filename: 'S1A_IW_GRDH_1SDV_20240115_SAR_VVVH.tif',
    modality: 'SAR',
    width: 1024,
    height: 1024,
    bands: 2,
    dtype: 'float32',
    crs: 'EPSG:32643',
    resolution_x: 10.0,
    resolution_y: 10.0,
    bounds: [72.82, 18.92, 72.95, 19.05],
    transform: [10.0, 0.0, 271200.0, 0.0, -10.0, 2108000.0],
    file_size_bytes: 8432110,
    preview_url: createDemoSatelliteSvg('sar_radar'),
    slot_label: 'Image 2'
  },
  img_l9_multispectral: {
    image_id: 'img_l9_multispectral',
    filename: 'LC09_L1TP_148047_20240201_MULTISPECTRAL.tif',
    modality: 'Multispectral',
    width: 1024,
    height: 1024,
    bands: 11,
    dtype: 'uint16',
    crs: 'EPSG:32643',
    resolution_x: 30.0,
    resolution_y: 30.0,
    bounds: [72.82, 18.92, 72.95, 19.05],
    transform: [30.0, 0.0, 271200.0, 0.0, -30.0, 2108000.0],
    file_size_bytes: 28941200,
    preview_url: createDemoSatelliteSvg('multispectral_cir'),
    slot_label: 'Image 1'
  },
  img_incompatible_raster: {
    image_id: 'img_incompatible_raster',
    filename: 'MODIS_TERRA_INCOMPATIBLE_REG.tif',
    modality: 'Optical',
    width: 512,
    height: 512,
    bands: 3,
    dtype: 'uint8',
    crs: 'EPSG:4326',
    resolution_x: 60.0,
    resolution_y: 60.0,
    bounds: [85.12, 25.58, 85.25, 25.71],
    transform: [0.0005, 0.0, 85.12, 0.0, -0.0005, 25.71],
    file_size_bytes: 3145728,
    preview_url: createDemoSatelliteSvg('incompatible'),
    slot_label: 'Image 2'
  }
};
