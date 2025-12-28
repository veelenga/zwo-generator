import { describe, it, expect } from 'vitest'
import {
  getZoneForPower,
  getZoneConfig,
  getColorForPower,
  getBgColorForPower,
  getZoneName,
  getAllZones,
} from './powerZones'

describe('getZoneForPower', () => {
  it('returns z1 for power below 0.55', () => {
    expect(getZoneForPower(0.3)).toBe('z1')
    expect(getZoneForPower(0.54)).toBe('z1')
  })

  it('returns z2 for power between 0.55 and 0.75', () => {
    expect(getZoneForPower(0.55)).toBe('z2')
    expect(getZoneForPower(0.6)).toBe('z2')
    expect(getZoneForPower(0.74)).toBe('z2')
  })

  it('returns z3 for power between 0.75 and 0.9', () => {
    expect(getZoneForPower(0.75)).toBe('z3')
    expect(getZoneForPower(0.85)).toBe('z3')
    expect(getZoneForPower(0.89)).toBe('z3')
  })

  it('returns z4 for power between 0.9 and 1.05', () => {
    expect(getZoneForPower(0.9)).toBe('z4')
    expect(getZoneForPower(1.0)).toBe('z4')
    expect(getZoneForPower(1.04)).toBe('z4')
  })

  it('returns z5 for power between 1.05 and 1.2', () => {
    expect(getZoneForPower(1.05)).toBe('z5')
    expect(getZoneForPower(1.1)).toBe('z5')
    expect(getZoneForPower(1.19)).toBe('z5')
  })

  it('returns z6 for power between 1.2 and 1.5', () => {
    expect(getZoneForPower(1.2)).toBe('z6')
    expect(getZoneForPower(1.3)).toBe('z6')
    expect(getZoneForPower(1.49)).toBe('z6')
  })

  it('returns z7 for power above 1.5', () => {
    expect(getZoneForPower(1.5)).toBe('z7')
    expect(getZoneForPower(2.0)).toBe('z7')
  })
})

describe('getZoneConfig', () => {
  it('returns config for z1', () => {
    const config = getZoneConfig('z1')
    expect(config.name).toBe('Recovery')
    expect(config.label).toBe('Z1')
    expect(config.min).toBe(0)
    expect(config.max).toBe(0.55)
  })

  it('returns config for z4', () => {
    const config = getZoneConfig('z4')
    expect(config.name).toBe('Threshold')
    expect(config.label).toBe('Z4')
    expect(config.min).toBe(0.9)
    expect(config.max).toBe(1.05)
  })

  it('returns config for z7', () => {
    const config = getZoneConfig('z7')
    expect(config.name).toBe('Neuromuscular')
    expect(config.label).toBe('Z7')
  })
})

describe('getColorForPower', () => {
  it('returns gray for z1', () => {
    expect(getColorForPower(0.3)).toBe('#9ca3af')
  })

  it('returns blue for z2', () => {
    expect(getColorForPower(0.6)).toBe('#3b82f6')
  })

  it('returns green for z3', () => {
    expect(getColorForPower(0.8)).toBe('#22c55e')
  })

  it('returns yellow for z4', () => {
    expect(getColorForPower(1.0)).toBe('#eab308')
  })

  it('returns orange for z5', () => {
    expect(getColorForPower(1.1)).toBe('#f97316')
  })

  it('returns red for z6', () => {
    expect(getColorForPower(1.3)).toBe('#ef4444')
  })

  it('returns dark red for z7', () => {
    expect(getColorForPower(1.6)).toBe('#dc2626')
  })
})

describe('getBgColorForPower', () => {
  it('returns bg class for each zone', () => {
    expect(getBgColorForPower(0.3)).toBe('bg-gray-400')
    expect(getBgColorForPower(0.6)).toBe('bg-blue-500')
    expect(getBgColorForPower(0.8)).toBe('bg-green-500')
    expect(getBgColorForPower(1.0)).toBe('bg-yellow-500')
    expect(getBgColorForPower(1.1)).toBe('bg-orange-500')
    expect(getBgColorForPower(1.3)).toBe('bg-red-500')
    expect(getBgColorForPower(1.6)).toBe('bg-red-600')
  })
})

describe('getZoneName', () => {
  it('returns zone names', () => {
    expect(getZoneName(0.3)).toBe('Recovery')
    expect(getZoneName(0.6)).toBe('Endurance')
    expect(getZoneName(0.8)).toBe('Tempo')
    expect(getZoneName(1.0)).toBe('Threshold')
    expect(getZoneName(1.1)).toBe('VO2max')
    expect(getZoneName(1.3)).toBe('Anaerobic')
    expect(getZoneName(1.6)).toBe('Neuromuscular')
  })
})

describe('getAllZones', () => {
  it('returns all 7 zones', () => {
    const zones = getAllZones()
    expect(zones).toHaveLength(7)
  })

  it('contains all zone names', () => {
    const zones = getAllZones()
    const names = zones.map((z) => z.name)
    expect(names).toContain('Recovery')
    expect(names).toContain('Endurance')
    expect(names).toContain('Tempo')
    expect(names).toContain('Threshold')
    expect(names).toContain('VO2max')
    expect(names).toContain('Anaerobic')
    expect(names).toContain('Neuromuscular')
  })
})
