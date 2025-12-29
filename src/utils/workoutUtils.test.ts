import { describe, it, expect, vi } from 'vitest'
import {
  getSegmentDuration,
  getTotalDuration,
  getSegmentAveragePower,
  estimateTSS,
  createEmptyWorkout,
  createSegment,
  duplicateSegment,
} from './workoutUtils'
import type {
  WorkoutSegment,
  IntervalsSegment,
  SteadyStateSegment,
  WarmupSegment,
  CooldownSegment,
  RampSegment,
  FreeRideSegment,
  MaxEffortSegment,
} from '../types/workout'

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}))

describe('getSegmentDuration', () => {
  it('returns duration for steadystate segment', () => {
    const segment: SteadyStateSegment = {
      id: '1',
      type: 'steadystate',
      duration: 300,
      power: 0.75,
    }
    expect(getSegmentDuration(segment)).toBe(300)
  })

  it('returns duration for warmup segment', () => {
    const segment: WarmupSegment = {
      id: '1',
      type: 'warmup',
      duration: 600,
      powerLow: 0.4,
      powerHigh: 0.7,
    }
    expect(getSegmentDuration(segment)).toBe(600)
  })

  it('calculates total duration for intervals segment', () => {
    const segment: IntervalsSegment = {
      id: '1',
      type: 'intervals',
      repeat: 5,
      onDuration: 60,
      offDuration: 60,
      onPower: 1.0,
      offPower: 0.5,
    }
    expect(getSegmentDuration(segment)).toBe(600)
  })
})

describe('getTotalDuration', () => {
  it('sums up all segment durations', () => {
    const segments: WorkoutSegment[] = [
      { id: '1', type: 'warmup', duration: 600, powerLow: 0.4, powerHigh: 0.7 },
      { id: '2', type: 'steadystate', duration: 300, power: 0.75 },
      { id: '3', type: 'cooldown', duration: 300, powerLow: 0.4, powerHigh: 0.6 },
    ]
    expect(getTotalDuration(segments)).toBe(1200)
  })

  it('returns 0 for empty array', () => {
    expect(getTotalDuration([])).toBe(0)
  })

  it('handles intervals correctly', () => {
    const segments: WorkoutSegment[] = [
      {
        id: '1',
        type: 'intervals',
        repeat: 4,
        onDuration: 60,
        offDuration: 60,
        onPower: 1.0,
        offPower: 0.5,
      },
    ]
    expect(getTotalDuration(segments)).toBe(480)
  })
})

describe('getSegmentAveragePower', () => {
  it('calculates average for warmup', () => {
    const segment: WarmupSegment = {
      id: '1',
      type: 'warmup',
      duration: 600,
      powerLow: 0.4,
      powerHigh: 0.8,
    }
    expect(getSegmentAveragePower(segment)).toBeCloseTo(0.6)
  })

  it('returns power for steadystate', () => {
    const segment: SteadyStateSegment = {
      id: '1',
      type: 'steadystate',
      duration: 300,
      power: 0.75,
    }
    expect(getSegmentAveragePower(segment)).toBe(0.75)
  })

  it('calculates weighted average for intervals', () => {
    const segment: IntervalsSegment = {
      id: '1',
      type: 'intervals',
      repeat: 1,
      onDuration: 60,
      offDuration: 60,
      onPower: 1.0,
      offPower: 0.5,
    }
    expect(getSegmentAveragePower(segment)).toBe(0.75)
  })

  it('returns 0.5 for freeride', () => {
    const segment: WorkoutSegment = {
      id: '1',
      type: 'freeride',
      duration: 600,
      flatRoad: false,
    }
    expect(getSegmentAveragePower(segment)).toBe(0.5)
  })

  it('returns 1.5 for maxeffort', () => {
    const segment: WorkoutSegment = {
      id: '1',
      type: 'maxeffort',
      duration: 30,
    }
    expect(getSegmentAveragePower(segment)).toBe(1.5)
  })
})

describe('estimateTSS', () => {
  it('returns 0 for empty segments', () => {
    expect(estimateTSS([])).toBe(0)
  })

  it('calculates TSS for simple workout', () => {
    const segments: WorkoutSegment[] = [
      { id: '1', type: 'steadystate', duration: 3600, power: 1.0 },
    ]
    expect(estimateTSS(segments)).toBe(100)
  })

  it('calculates lower TSS for recovery ride', () => {
    const segments: WorkoutSegment[] = [
      { id: '1', type: 'steadystate', duration: 3600, power: 0.5 },
    ]
    expect(estimateTSS(segments)).toBe(25)
  })
})

describe('createEmptyWorkout', () => {
  it('creates workout with default values', () => {
    const workout = createEmptyWorkout()
    expect(workout.id).toBe('test-uuid-1234')
    expect(workout.name).toBe('New Workout')
    expect(workout.description).toBe('')
    expect(workout.author).toBe('')
    expect(workout.sportType).toBe('bike')
    expect(workout.segments).toEqual([])
    expect(workout.tags).toEqual([])
  })

  it('sets timestamps', () => {
    const before = new Date().toISOString()
    const workout = createEmptyWorkout()
    const after = new Date().toISOString()

    expect(workout.createdAt >= before).toBe(true)
    expect(workout.createdAt <= after).toBe(true)
    expect(workout.updatedAt).toBe(workout.createdAt)
  })
})

describe('createSegment', () => {
  it('creates warmup segment with defaults', () => {
    const segment = createSegment('warmup') as WarmupSegment
    expect(segment.type).toBe('warmup')
    expect(segment.id).toBe('test-uuid-1234')
    expect(segment.duration).toBe(600)
    expect(segment.powerLow).toBe(0.4)
    expect(segment.powerHigh).toBe(0.7)
  })

  it('creates cooldown segment with defaults', () => {
    const segment = createSegment('cooldown') as CooldownSegment
    expect(segment.type).toBe('cooldown')
    expect(segment.duration).toBe(300)
    expect(segment.powerLow).toBe(0.4)
    expect(segment.powerHigh).toBe(0.6)
    expect(segment.powerLow).toBeLessThan(segment.powerHigh)
  })

  it('creates steadystate segment with defaults', () => {
    const segment = createSegment('steadystate') as SteadyStateSegment
    expect(segment.type).toBe('steadystate')
    expect(segment.duration).toBe(300)
    expect(segment.power).toBe(0.75)
  })

  it('creates intervals segment with defaults', () => {
    const segment = createSegment('intervals') as IntervalsSegment
    expect(segment.type).toBe('intervals')
    expect(segment.repeat).toBe(4)
    expect(segment.onDuration).toBe(60)
    expect(segment.offDuration).toBe(60)
    expect(segment.onPower).toBe(1.0)
    expect(segment.offPower).toBe(0.5)
  })

  it('creates ramp segment with defaults', () => {
    const segment = createSegment('ramp') as RampSegment
    expect(segment.type).toBe('ramp')
    expect(segment.duration).toBe(300)
  })

  it('creates freeride segment with defaults', () => {
    const segment = createSegment('freeride') as FreeRideSegment
    expect(segment.type).toBe('freeride')
    expect(segment.duration).toBe(600)
  })

  it('creates maxeffort segment with defaults', () => {
    const segment = createSegment('maxeffort') as MaxEffortSegment
    expect(segment.type).toBe('maxeffort')
    expect(segment.duration).toBe(30)
  })
})

describe('duplicateSegment', () => {
  it('creates copy with new id', () => {
    const original: SteadyStateSegment = {
      id: 'original-id',
      type: 'steadystate',
      duration: 300,
      power: 0.8,
    }
    const copy = duplicateSegment(original) as SteadyStateSegment

    expect(copy.id).toBe('test-uuid-1234')
    expect(copy.type).toBe('steadystate')
    expect(copy.duration).toBe(300)
    expect(copy.power).toBe(0.8)
  })

  it('does not mutate original', () => {
    const original: SteadyStateSegment = {
      id: 'original-id',
      type: 'steadystate',
      duration: 300,
      power: 0.8,
    }
    duplicateSegment(original)

    expect(original.id).toBe('original-id')
  })
})
