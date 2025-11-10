// Sample chart data for testing

const sampleNatalChart = {
  planets: {
    sun: { lon: 85.83, lat: 0.0 },
    moon: { lon: 133.21, lat: 5.12 },
    mercury: { lon: 95.45, lat: -2.3 },
    venus: { lon: 110.2, lat: 1.5 },
    mars: { lon: 45.3, lat: -0.8 },
    jupiter: { lon: 200.15, lat: 0.5 },
    saturn: { lon: 290.45, lat: 2.1 },
    uranus: { lon: 15.6, lat: -0.3 },
    neptune: { lon: 325.8, lat: 1.2 },
    pluto: { lon: 270.25, lat: 15.0 },
  },
  houses: [
    { lon: 300.32 },
    { lon: 330.15 },
    { lon: 355.24 },
    { lon: 20.32 },
    { lon: 45.15 },
    { lon: 75.24 },
    { lon: 120.32 },
    { lon: 150.15 },
    { lon: 175.24 },
    { lon: 200.32 },
    { lon: 225.15 },
    { lon: 255.24 },
  ],
  aspectSettings: {
    enabled: true,
    orb: 6,
    types: {
      conjunction: { enabled: true },
      opposition: { enabled: true },
      trine: { enabled: true },
      square: { enabled: true },
      sextile: { enabled: true },
    },
  },
  renderOptions: {
    format: 'png',
    width: 800,
    height: 800,
    quality: 90,
    theme: 'light',
  },
};

const sampleTransitChart = {
  natal: {
    planets: sampleNatalChart.planets,
    houses: sampleNatalChart.houses,
  },
  transit: {
    planets: {
      sun: { lon: 290.15, lat: 0.0 },
      moon: { lon: 45.67, lat: 4.8 },
      mercury: { lon: 275.3, lat: -1.5 },
      venus: { lon: 310.45, lat: 2.1 },
      mars: { lon: 180.2, lat: -1.2 },
      jupiter: { lon: 65.8, lat: 0.8 },
      saturn: { lon: 350.9, lat: 2.5 },
      uranus: { lon: 25.4, lat: -0.5 },
      neptune: { lon: 330.1, lat: 1.0 },
      pluto: { lon: 275.6, lat: 16.2 },
    },
    datetime: '2025-11-09T12:00:00Z',
  },
  aspectSettings: {
    natal: { enabled: true, orb: 6 },
    transit: { enabled: false, orb: 6 },
    natalToTransit: { enabled: true, orb: 3 },
  },
  renderOptions: {
    format: 'png',
    width: 1000,
    height: 1000,
    quality: 90,
    theme: 'light',
  },
};

const sampleSynastryChart = {
  person1: {
    name: 'John',
    planets: sampleNatalChart.planets,
    houses: sampleNatalChart.houses,
  },
  person2: {
    name: 'Jane',
    planets: sampleTransitChart.transit.planets,
    houses: [
      { lon: 15.45 },
      { lon: 42.3 },
      { lon: 68.2 },
      { lon: 95.1 },
      { lon: 125.5 },
      { lon: 155.8 },
      { lon: 195.45 },
      { lon: 222.3 },
      { lon: 248.2 },
      { lon: 275.1 },
      { lon: 305.5 },
      { lon: 335.8 },
    ],
  },
  synastrySettings: {
    useHousesFrom: 'person1',
    aspectSettings: {
      person1: { enabled: true, orb: 6 },
      person2: { enabled: false, orb: 6 },
      interaspects: { enabled: true, orb: 6 },
    },
  },
  renderOptions: {
    format: 'png',
    width: 1000,
    height: 1000,
    quality: 90,
    theme: 'light',
  },
};

module.exports = {
  sampleNatalChart,
  sampleTransitChart,
  sampleSynastryChart,
};

