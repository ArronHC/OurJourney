export const CITY_COORDS: Record<string, [number, number]> = {
  北京: [39.9042, 116.4074],
  上海: [31.2304, 121.4737],
  广州: [23.1291, 113.2644],
  深圳: [22.5431, 114.0579],
  成都: [30.5728, 104.0668],
  重庆: [29.563, 106.5516],
  杭州: [30.2741, 120.1551],
  武汉: [30.5928, 114.3055],
  南京: [32.0603, 118.7969],
  天津: [39.3434, 117.3616],
  西安: [34.3416, 108.9398],
  长沙: [28.2282, 112.9388],
  青岛: [36.0671, 120.3826],
  大连: [38.914, 121.6147],
  厦门: [24.4798, 118.0894],
  昆明: [25.0389, 102.7183],
  郑州: [34.7466, 113.6254],
  沈阳: [41.8057, 123.4315],
  哈尔滨: [45.8038, 126.535],
  济南: [36.6512, 116.9972],
  福州: [26.0745, 119.2965],
  合肥: [31.8206, 117.2272],
  南昌: [28.682, 115.8579],
  长春: [43.8171, 125.3235],
  贵阳: [26.647, 106.6302],
  南宁: [22.817, 108.3665],
  太原: [37.8706, 112.5489],
  石家庄: [38.0428, 114.5149],
  兰州: [36.0611, 103.8343],
  海口: [20.0174, 110.3492],
  拉萨: [29.65, 91.1],
  乌鲁木齐: [43.8256, 87.6168],
  呼和浩特: [40.8422, 111.7491],
  银川: [38.4872, 106.2309],
  西宁: [36.6171, 101.7782],
  苏州: [31.299, 120.5853],
  无锡: [31.4912, 120.3119],
  珠海: [22.271, 113.5767],
  三亚: [18.2528, 109.512],
};

const DISTANCE_FACTS: [number, string][] = [
  [1000, '相当于北京到上海'],
  [2000, '相当于北京到广州的一半'],
  [4000, '相当于北京到广州两个来回'],
  [8000, '相当于北京到巴黎'],
  [12000, '相当于北京到纽约'],
  [20000, '快绕地球半圈了'],
  [40000, '已经绕地球一圈了！'],
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function matchCity(name: string): string | null {
  if (!name) {
    return null;
  }

  if (CITY_COORDS[name]) {
    return name;
  }

  for (const city of Object.keys(CITY_COORDS)) {
    if (name.startsWith(city) || name.includes(city)) {
      return city;
    }
  }

  return null;
}

export function getDistance(cityA: string, cityB: string): number {
  const a = matchCity(cityA);
  const b = matchCity(cityB);
  if (!a || !b) {
    return 0;
  }

  const [lat1, lon1] = CITY_COORDS[a];
  const [lat2, lon2] = CITY_COORDS[b];
  return Math.round(haversine(lat1, lon1, lat2, lon2));
}

export function getDistanceFunFact(totalKm: number): string {
  if (totalKm === 0) {
    return '';
  }

  for (let i = DISTANCE_FACTS.length - 1; i >= 0; i -= 1) {
    if (totalKm >= DISTANCE_FACTS[i][0]) {
      return DISTANCE_FACTS[i][1];
    }
  }

  return `相当于从北京到天津 ${Math.round(totalKm / 120)} 趟`;
}
