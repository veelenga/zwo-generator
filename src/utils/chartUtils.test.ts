import { describe, it, expect } from 'vitest';
import {
  createPowerToYConverter,
  calculateXAxisTicks,
  getSegmentPath,
  POWER_DISPLAY_RANGE,
} from './chartUtils';
import type {
  WarmupSegment,
  CooldownSegment,
  SteadyStateSegment,
  IntervalsSegment,
  RampSegment,
  FreeRideSegment,
  MaxEffortSegment,
} from '../types/workout';

describe('createPowerToYConverter', () => {
  const innerHeight = 140;
  const paddingTop = 20;

  it('converts 0 power to bottom of chart', () => {
    const powerToY = createPowerToYConverter(innerHeight, paddingTop);
    expect(powerToY(0)).toBe(paddingTop + innerHeight);
  });

  it('converts max power to top of chart', () => {
    const powerToY = createPowerToYConverter(innerHeight, paddingTop);
    expect(powerToY(POWER_DISPLAY_RANGE.max)).toBe(paddingTop);
  });

  it('converts FTP (1.0) to correct position', () => {
    const powerToY = createPowerToYConverter(innerHeight, paddingTop);
    // 1.0 is 2/3 of the way up (1.0 / 1.5)
    const expected = paddingTop + innerHeight * (1 - 1.0 / 1.5);
    expect(powerToY(1.0)).toBeCloseTo(expected);
  });

  it('handles custom power range', () => {
    const powerToY = createPowerToYConverter(innerHeight, paddingTop, 0, 2.0);
    // 1.0 is halfway up when max is 2.0
    const expected = paddingTop + innerHeight * 0.5;
    expect(powerToY(1.0)).toBe(expected);
  });
});

describe('calculateXAxisTicks', () => {
  it('returns empty array for zero duration', () => {
    expect(calculateXAxisTicks(0)).toEqual([]);
  });

  it('returns start and end for short duration', () => {
    const ticks = calculateXAxisTicks(120);
    expect(ticks).toEqual([0, 120]);
  });

  it('returns rounded tick values', () => {
    const ticks = calculateXAxisTicks(1000);
    ticks.forEach((tick) => {
      expect(Number.isInteger(tick)).toBe(true);
    });
  });

  it('limits number of ticks for long duration', () => {
    const ticks = calculateXAxisTicks(7200); // 2 hours
    expect(ticks.length).toBeLessThanOrEqual(7); // MAX_X_AXIS_TICKS + 1
  });

  it('includes 0 as first tick', () => {
    const ticks = calculateXAxisTicks(1800);
    expect(ticks[0]).toBe(0);
  });

  it('includes total duration as last tick', () => {
    const ticks = calculateXAxisTicks(1800);
    expect(ticks[ticks.length - 1]).toBe(1800);
  });
});

describe('getSegmentPath', () => {
  const mockPowerToY = (power: number) => 160 - power * 100;
  const x = 50;
  const width = 100;

  describe('warmup segment', () => {
    const segment: WarmupSegment = {
      id: '1',
      type: 'warmup',
      duration: 600,
      powerLow: 0.4,
      powerHigh: 0.7,
    };

    it('creates ramp up path (low to high)', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);

      const baseline = mockPowerToY(0);
      const startY = mockPowerToY(0.4);
      const endY = mockPowerToY(0.7);

      expect(result.points).toBe(
        `${x},${baseline} ${x},${startY} ${x + width},${endY} ${x + width},${baseline}`
      );
    });

    it('calculates average power', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);
      expect(result.avgPower).toBeCloseTo(0.55);
    });
  });

  describe('cooldown segment', () => {
    const segment: CooldownSegment = {
      id: '1',
      type: 'cooldown',
      duration: 300,
      powerLow: 0.4,
      powerHigh: 0.6,
    };

    it('creates ramp down path (high to low)', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);

      const baseline = mockPowerToY(0);
      const startY = mockPowerToY(0.6); // starts at powerHigh
      const endY = mockPowerToY(0.4);   // ends at powerLow

      expect(result.points).toBe(
        `${x},${baseline} ${x},${startY} ${x + width},${endY} ${x + width},${baseline}`
      );
    });

    it('calculates average power', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);
      expect(result.avgPower).toBeCloseTo(0.5);
    });
  });

  describe('steadystate segment', () => {
    const segment: SteadyStateSegment = {
      id: '1',
      type: 'steadystate',
      duration: 300,
      power: 0.75,
    };

    it('creates flat rectangle path', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);

      const baseline = mockPowerToY(0);
      const y = mockPowerToY(0.75);

      expect(result.points).toBe(
        `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`
      );
    });

    it('returns exact power as average', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);
      expect(result.avgPower).toBe(0.75);
    });
  });

  describe('intervals segment', () => {
    const segment: IntervalsSegment = {
      id: '1',
      type: 'intervals',
      repeat: 2,
      onDuration: 60,
      offDuration: 60,
      onPower: 1.0,
      offPower: 0.5,
    };

    it('creates alternating pattern', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);

      // Should contain multiple coordinates for the step pattern
      const points = result.points.split(' ');
      expect(points.length).toBeGreaterThan(4);
    });

    it('calculates weighted average power', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);
      // Equal on/off duration means simple average
      expect(result.avgPower).toBeCloseTo(0.75);
    });

    it('handles unequal on/off durations', () => {
      const unequalSegment: IntervalsSegment = {
        ...segment,
        onDuration: 30,
        offDuration: 90,
      };
      const result = getSegmentPath(unequalSegment, x, width, mockPowerToY);
      // 30s at 1.0 + 90s at 0.5 = (30 + 45) / 120 = 0.625
      expect(result.avgPower).toBeCloseTo(0.625);
    });
  });

  describe('ramp segment', () => {
    const segment: RampSegment = {
      id: '1',
      type: 'ramp',
      duration: 300,
      powerLow: 0.5,
      powerHigh: 1.0,
    };

    it('creates ramp up path like warmup', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);

      const baseline = mockPowerToY(0);
      const startY = mockPowerToY(0.5);
      const endY = mockPowerToY(1.0);

      expect(result.points).toBe(
        `${x},${baseline} ${x},${startY} ${x + width},${endY} ${x + width},${baseline}`
      );
    });

    it('calculates average power', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);
      expect(result.avgPower).toBeCloseTo(0.75);
    });
  });

  describe('freeride segment', () => {
    const segment: FreeRideSegment = {
      id: '1',
      type: 'freeride',
      duration: 600,
    };

    it('creates flat rectangle at 50% power', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);

      const baseline = mockPowerToY(0);
      const y = mockPowerToY(0.5);

      expect(result.points).toBe(
        `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`
      );
    });

    it('returns 0.5 as average power', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);
      expect(result.avgPower).toBe(0.5);
    });
  });

  describe('maxeffort segment', () => {
    const segment: MaxEffortSegment = {
      id: '1',
      type: 'maxeffort',
      duration: 30,
    };

    it('creates flat rectangle at 150% power', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);

      const baseline = mockPowerToY(0);
      const y = mockPowerToY(1.5);

      expect(result.points).toBe(
        `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`
      );
    });

    it('returns 1.5 as average power', () => {
      const result = getSegmentPath(segment, x, width, mockPowerToY);
      expect(result.avgPower).toBe(1.5);
    });
  });
});
