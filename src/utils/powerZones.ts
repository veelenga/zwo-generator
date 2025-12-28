import type { PowerZone } from '../types/workout';

interface ZoneConfig {
  name: string;
  label: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
}

const ZONE_CONFIGS: Record<PowerZone, ZoneConfig> = {
  z1: {
    name: 'Recovery',
    label: 'Z1',
    min: 0,
    max: 0.55,
    color: '#9ca3af',
    bgColor: 'bg-gray-400',
  },
  z2: {
    name: 'Endurance',
    label: 'Z2',
    min: 0.55,
    max: 0.75,
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
  },
  z3: {
    name: 'Tempo',
    label: 'Z3',
    min: 0.75,
    max: 0.9,
    color: '#22c55e',
    bgColor: 'bg-green-500',
  },
  z4: {
    name: 'Threshold',
    label: 'Z4',
    min: 0.9,
    max: 1.05,
    color: '#eab308',
    bgColor: 'bg-yellow-500',
  },
  z5: {
    name: 'VO2max',
    label: 'Z5',
    min: 1.05,
    max: 1.2,
    color: '#f97316',
    bgColor: 'bg-orange-500',
  },
  z6: {
    name: 'Anaerobic',
    label: 'Z6',
    min: 1.2,
    max: 1.5,
    color: '#ef4444',
    bgColor: 'bg-red-500',
  },
  z7: {
    name: 'Neuromuscular',
    label: 'Z7',
    min: 1.5,
    max: 3.0,
    color: '#dc2626',
    bgColor: 'bg-red-600',
  },
};

export function getZoneForPower(power: number): PowerZone {
  if (power < 0.55) return 'z1';
  if (power < 0.75) return 'z2';
  if (power < 0.9) return 'z3';
  if (power < 1.05) return 'z4';
  if (power < 1.2) return 'z5';
  if (power < 1.5) return 'z6';
  return 'z7';
}

export function getZoneConfig(zone: PowerZone): ZoneConfig {
  return ZONE_CONFIGS[zone];
}

export function getColorForPower(power: number): string {
  const zone = getZoneForPower(power);
  return ZONE_CONFIGS[zone].color;
}

export function getBgColorForPower(power: number): string {
  const zone = getZoneForPower(power);
  return ZONE_CONFIGS[zone].bgColor;
}

export function getZoneName(power: number): string {
  const zone = getZoneForPower(power);
  return ZONE_CONFIGS[zone].name;
}

export function getAllZones(): ZoneConfig[] {
  return Object.values(ZONE_CONFIGS);
}
