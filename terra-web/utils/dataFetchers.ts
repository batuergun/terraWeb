// Mock data generators
function generateMockWeatherData() {
  return {
    temperature: Math.round(Math.random() * 30 + 5), // 5 to 35 degrees Celsius
    precipitation: Math.round(Math.random() * 100) / 10, // 0 to 10 mm
    humidity: Math.round(Math.random() * 60 + 40), // 40% to 100%
    windSpeed: Math.round(Math.random() * 20), // 0 to 20 m/s
  };
}

function generateMockAgricultureData() {
  const soilTypes = ["Loam", "Clay", "Sandy", "Silt", "Peat"];
  const landCoverClasses = [
    "Cropland",
    "Grassland",
    "Forest",
    "Wetland",
    "Urban",
  ];

  return {
    soilType: soilTypes[Math.floor(Math.random() * soilTypes.length)],
    soilpH: Math.round((Math.random() * 3 + 5) * 10) / 10, // 5.0 to 8.0
    organicCarbonContent: Math.round(Math.random() * 5 * 10) / 10, // 0 to 5%
    landCoverClass:
      landCoverClasses[Math.floor(Math.random() * landCoverClasses.length)],
  };
}

function generateMockSensorData() {
  return {
    soilMoisture: Math.round(Math.random() * 100), // 0 to 100%
    soilTemperature: Math.round((Math.random() * 30 + 5) * 10) / 10, // 5.0 to 35.0°C
    airQuality: {
      pm25: Math.round(Math.random() * 50), // 0 to 50 µg/m³
      pm10: Math.round(Math.random() * 100), // 0 to 100 µg/m³
    },
    lightIntensity: Math.round(Math.random() * 100000), // 0 to 100,000 lux
  };
}

function generateMockTerrainData() {
  return {
    elevation: Math.round(Math.random() * 1000), // 0 to 1000 meters
    slope: Math.round(Math.random() * 45), // 0 to 45 degrees
    aspect: Math.round(Math.random() * 360), // 0 to 360 degrees
  };
}

export async function fetchWeatherData(lat: number, lng: number) {
  console.log(`Fetching weather data for coordinates: ${lat}, ${lng}`);
  return generateMockWeatherData();
}

export async function fetchAgricultureData(lat: number, lng: number) {
  console.log(`Fetching agriculture data for coordinates: ${lat}, ${lng}`);
  return generateMockAgricultureData();
}

export async function fetchSensorData(lat: number, lng: number) {
  console.log(`Fetching sensor data for coordinates: ${lat}, ${lng}`);
  return generateMockSensorData();
}

// Add this new function
export async function fetchTerrainData(lat: number, lng: number) {
  console.log(`Fetching terrain data for coordinates: ${lat}, ${lng}`);
  return generateMockTerrainData();
}
