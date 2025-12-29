import { describe, it, expect } from 'vitest'
import { workoutToZwo } from './zwoExport'
import type { Workout } from '../types/workout'

const createTestWorkout = (segments: Workout['segments']): Workout => ({
  id: 'test-id',
  name: 'Test Workout',
  description: 'Test description',
  author: 'Test Author',
  sportType: 'bike',
  segments,
  tags: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
})

describe('workoutToZwo', () => {
  describe('warmup segment', () => {
    it('exports warmup with powerLow as start and powerHigh as end', () => {
      const workout = createTestWorkout([
        { id: '1', type: 'warmup', duration: 600, powerLow: 0.4, powerHigh: 0.7 },
      ])
      const zwo = workoutToZwo(workout)

      expect(zwo).toContain('PowerLow="0.40"')
      expect(zwo).toContain('PowerHigh="0.70"')
      expect(zwo).toContain('<Warmup Duration="600"')
    })
  })

  describe('cooldown segment', () => {
    it('exports cooldown with powerHigh as PowerLow (start) and powerLow as PowerHigh (end)', () => {
      const workout = createTestWorkout([
        { id: '1', type: 'cooldown', duration: 300, powerLow: 0.4, powerHigh: 0.6 },
      ])
      const zwo = workoutToZwo(workout)

      // ZWO format: PowerLow = start power, PowerHigh = end power
      // For cooldown: start high (0.6), end low (0.4)
      expect(zwo).toContain('<Cooldown Duration="300" PowerLow="0.60" PowerHigh="0.40"')
    })

    it('ensures cooldown ramps down (PowerLow > PowerHigh in output)', () => {
      const workout = createTestWorkout([
        { id: '1', type: 'cooldown', duration: 300, powerLow: 0.3, powerHigh: 0.8 },
      ])
      const zwo = workoutToZwo(workout)

      // PowerLow in output should be the higher value (start)
      // PowerHigh in output should be the lower value (end)
      expect(zwo).toContain('PowerLow="0.80"')
      expect(zwo).toContain('PowerHigh="0.30"')
    })
  })

  describe('ramp segment', () => {
    it('exports ramp with powerLow as start and powerHigh as end', () => {
      const workout = createTestWorkout([
        { id: '1', type: 'ramp', duration: 300, powerLow: 0.5, powerHigh: 1.0 },
      ])
      const zwo = workoutToZwo(workout)

      expect(zwo).toContain('<Ramp Duration="300" PowerLow="0.50" PowerHigh="1.00"')
    })
  })

  describe('steadystate segment', () => {
    it('exports steadystate with single power value', () => {
      const workout = createTestWorkout([
        { id: '1', type: 'steadystate', duration: 300, power: 0.75 },
      ])
      const zwo = workoutToZwo(workout)

      expect(zwo).toContain('<SteadyState Duration="300" Power="0.75"')
    })
  })

  describe('intervals segment', () => {
    it('exports intervals with correct attributes', () => {
      const workout = createTestWorkout([
        {
          id: '1',
          type: 'intervals',
          repeat: 4,
          onDuration: 60,
          offDuration: 60,
          onPower: 1.0,
          offPower: 0.5,
        },
      ])
      const zwo = workoutToZwo(workout)

      expect(zwo).toContain('<IntervalsT Repeat="4"')
      expect(zwo).toContain('OnDuration="60"')
      expect(zwo).toContain('OffDuration="60"')
      expect(zwo).toContain('OnPower="1.00"')
      expect(zwo).toContain('OffPower="0.50"')
    })
  })

  describe('cadence', () => {
    it('includes cadence when specified', () => {
      const workout = createTestWorkout([
        { id: '1', type: 'steadystate', duration: 300, power: 0.75, cadence: 90 },
      ])
      const zwo = workoutToZwo(workout)

      expect(zwo).toContain('Cadence="90"')
    })

    it('omits cadence when not specified', () => {
      const workout = createTestWorkout([
        { id: '1', type: 'steadystate', duration: 300, power: 0.75 },
      ])
      const zwo = workoutToZwo(workout)

      expect(zwo).not.toContain('Cadence=')
    })
  })

  describe('xml structure', () => {
    it('includes xml declaration', () => {
      const workout = createTestWorkout([])
      const zwo = workoutToZwo(workout)

      expect(zwo).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    })

    it('includes workout metadata', () => {
      const workout = createTestWorkout([])
      const zwo = workoutToZwo(workout)

      expect(zwo).toContain('<author>Test Author</author>')
      expect(zwo).toContain('<name>Test Workout</name>')
      expect(zwo).toContain('<description>Test description</description>')
      expect(zwo).toContain('<sportType>bike</sportType>')
    })

    it('escapes special characters in metadata', () => {
      const workout = createTestWorkout([])
      workout.name = 'Test & Workout <Special>'
      workout.description = 'Description with "quotes"'
      const zwo = workoutToZwo(workout)

      expect(zwo).toContain('&amp;')
      expect(zwo).toContain('&lt;')
      expect(zwo).toContain('&gt;')
      expect(zwo).toContain('&quot;')
    })
  })
})
