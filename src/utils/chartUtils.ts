import type { WorkoutSegment, IntervalsSegment } from '../types/workout';

export interface SegmentPathResult {
  points: string;
  avgPower: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export const DEFAULT_CHART_DIMENSIONS: ChartDimensions = {
  width: 800,
  height: 200,
  padding: { top: 20, right: 20, bottom: 40, left: 50 },
};

export const POWER_DISPLAY_RANGE = {
  min: 0,
  max: 1.5,
};

const TICK_INTERVAL_SECONDS = 300;
const MAX_X_AXIS_TICKS = 6;

export function createPowerToYConverter(
  innerHeight: number,
  paddingTop: number,
  minPower: number = POWER_DISPLAY_RANGE.min,
  maxPower: number = POWER_DISPLAY_RANGE.max
): (power: number) => number {
  return (power: number) => {
    const normalized = (power - minPower) / (maxPower - minPower);
    return paddingTop + innerHeight * (1 - normalized);
  };
}

export function calculateXAxisTicks(totalDuration: number): number[] {
  if (totalDuration === 0) return [];
  const tickCount = Math.min(MAX_X_AXIS_TICKS, Math.floor(totalDuration / TICK_INTERVAL_SECONDS));
  if (tickCount === 0) return [0, totalDuration];
  const interval = totalDuration / tickCount;
  return Array.from({ length: tickCount + 1 }, (_, i) => Math.round(i * interval));
}

export function getSegmentPath(
  segment: WorkoutSegment,
  x: number,
  width: number,
  powerToY: (power: number) => number
): SegmentPathResult {
  const baseline = powerToY(0);

  switch (segment.type) {
    case 'warmup':
    case 'ramp': {
      const startY = powerToY(segment.powerLow);
      const endY = powerToY(segment.powerHigh);
      return {
        points: `${x},${baseline} ${x},${startY} ${x + width},${endY} ${x + width},${baseline}`,
        avgPower: (segment.powerLow + segment.powerHigh) / 2,
      };
    }
    case 'cooldown': {
      const startY = powerToY(segment.powerHigh);
      const endY = powerToY(segment.powerLow);
      return {
        points: `${x},${baseline} ${x},${startY} ${x + width},${endY} ${x + width},${baseline}`,
        avgPower: (segment.powerLow + segment.powerHigh) / 2,
      };
    }
    case 'steadystate': {
      const y = powerToY(segment.power);
      return {
        points: `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`,
        avgPower: segment.power,
      };
    }
    case 'intervals': {
      const intervals = segment as IntervalsSegment;
      const singleIntervalWidth = width / intervals.repeat;
      const onRatio = intervals.onDuration / (intervals.onDuration + intervals.offDuration);
      const onWidth = singleIntervalWidth * onRatio;

      let points = `${x},${baseline}`;
      let currentX = x;

      for (let i = 0; i < intervals.repeat; i++) {
        const onY = powerToY(intervals.onPower);
        const offY = powerToY(intervals.offPower);

        points += ` ${currentX},${onY} ${currentX + onWidth},${onY}`;
        points += ` ${currentX + onWidth},${offY} ${currentX + singleIntervalWidth},${offY}`;
        currentX += singleIntervalWidth;
      }

      points += ` ${x + width},${baseline}`;

      const avgPower =
        (intervals.onPower * intervals.onDuration + intervals.offPower * intervals.offDuration) /
        (intervals.onDuration + intervals.offDuration);

      return { points, avgPower };
    }
    case 'freeride': {
      const y = powerToY(0.5);
      return {
        points: `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`,
        avgPower: 0.5,
      };
    }
    case 'maxeffort': {
      const y = powerToY(1.5);
      return {
        points: `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`,
        avgPower: 1.5,
      };
    }
    default:
      return { points: '', avgPower: 0 };
  }
}
