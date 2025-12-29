import { v4 as uuidv4 } from 'uuid';
import type { Workout, WorkoutSegment, IntervalsSegment } from '../types/workout';

export function getSegmentDuration(segment: WorkoutSegment): number {
  if (segment.type === 'intervals') {
    const intervals = segment as IntervalsSegment;
    return intervals.repeat * (intervals.onDuration + intervals.offDuration);
  }
  return segment.duration;
}

export function getTotalDuration(segments: WorkoutSegment[]): number {
  return segments.reduce((total, segment) => total + getSegmentDuration(segment), 0);
}

export function getSegmentAveragePower(segment: WorkoutSegment): number {
  switch (segment.type) {
    case 'warmup':
    case 'cooldown':
    case 'ramp':
      return (segment.powerLow + segment.powerHigh) / 2;
    case 'steadystate':
      return segment.power;
    case 'intervals': {
      const totalOnTime = segment.repeat * segment.onDuration;
      const totalOffTime = segment.repeat * segment.offDuration;
      const totalTime = totalOnTime + totalOffTime;
      return (segment.onPower * totalOnTime + segment.offPower * totalOffTime) / totalTime;
    }
    case 'freeride':
      return 0.5;
    case 'maxeffort':
      return 1.5;
    default:
      return 0.5;
  }
}

const TSS_BASE_FACTOR = 100;
const SECONDS_PER_HOUR = 3600;
const INTENSITY_FACTOR_EXPONENT = 2;

export function estimateTSS(segments: WorkoutSegment[]): number {
  let weightedSum = 0;
  let totalDuration = 0;

  for (const segment of segments) {
    const duration = getSegmentDuration(segment);
    const avgPower = getSegmentAveragePower(segment);
    const intensityFactor = avgPower;
    weightedSum += duration * Math.pow(intensityFactor, INTENSITY_FACTOR_EXPONENT);
    totalDuration += duration;
  }

  if (totalDuration === 0) return 0;

  const normalizedPower = Math.sqrt(weightedSum / totalDuration);
  const tss = (totalDuration / SECONDS_PER_HOUR) * Math.pow(normalizedPower, INTENSITY_FACTOR_EXPONENT) * TSS_BASE_FACTOR;

  return Math.round(tss);
}

export function createEmptyWorkout(): Workout {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: 'New Workout',
    description: '',
    author: '',
    sportType: 'bike',
    segments: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createSegment(type: WorkoutSegment['type']): WorkoutSegment {
  const baseSegment = { id: uuidv4() };

  switch (type) {
    case 'warmup':
      return { ...baseSegment, type: 'warmup', duration: 600, powerLow: 0.4, powerHigh: 0.7 };
    case 'cooldown':
      return { ...baseSegment, type: 'cooldown', duration: 300, powerLow: 0.4, powerHigh: 0.6 };
    case 'steadystate':
      return { ...baseSegment, type: 'steadystate', duration: 300, power: 0.75 };
    case 'intervals':
      return {
        ...baseSegment,
        type: 'intervals',
        repeat: 4,
        onDuration: 60,
        offDuration: 60,
        onPower: 1.0,
        offPower: 0.5,
      };
    case 'ramp':
      return { ...baseSegment, type: 'ramp', duration: 300, powerLow: 0.5, powerHigh: 1.0 };
    case 'freeride':
      return { ...baseSegment, type: 'freeride', duration: 600, flatRoad: false };
    case 'maxeffort':
      return { ...baseSegment, type: 'maxeffort', duration: 30 };
    default:
      return { ...baseSegment, type: 'steadystate', duration: 300, power: 0.75 };
  }
}

export function duplicateSegment(segment: WorkoutSegment): WorkoutSegment {
  return { ...segment, id: uuidv4() };
}
