import { describe, it, expect } from 'vitest'
import {
  formatDuration,
  formatDurationShort,
  formatPower,
  formatPowerWithWatts,
  formatWatts,
  formatPowerRange,
  formatPowerRangeWithWatts,
  parseDurationInput,
} from './formatters'

describe('formatDuration', () => {
  it('formats seconds to mm:ss', () => {
    expect(formatDuration(65)).toBe('1:05')
  })

  it('formats minutes only', () => {
    expect(formatDuration(300)).toBe('5:00')
  })

  it('formats with hours', () => {
    expect(formatDuration(3665)).toBe('1:01:05')
  })

  it('handles zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('pads seconds with leading zero', () => {
    expect(formatDuration(62)).toBe('1:02')
  })

  it('pads minutes with leading zero when hours present', () => {
    expect(formatDuration(3605)).toBe('1:00:05')
  })
})

describe('formatDurationShort', () => {
  it('formats minutes only', () => {
    expect(formatDurationShort(300)).toBe('5m')
  })

  it('formats hours only', () => {
    expect(formatDurationShort(3600)).toBe('1h')
  })

  it('formats hours and minutes', () => {
    expect(formatDurationShort(5400)).toBe('1h 30m')
  })

  it('handles zero', () => {
    expect(formatDurationShort(0)).toBe('0m')
  })
})

describe('formatPower', () => {
  it('converts decimal to percentage', () => {
    expect(formatPower(0.75)).toBe('75%')
  })

  it('handles 100%', () => {
    expect(formatPower(1.0)).toBe('100%')
  })

  it('handles values above 100%', () => {
    expect(formatPower(1.2)).toBe('120%')
  })

  it('rounds to nearest integer', () => {
    expect(formatPower(0.755)).toBe('76%')
  })
})

describe('formatPowerWithWatts', () => {
  it('formats power with both percentage and watts', () => {
    expect(formatPowerWithWatts(0.75, 200)).toBe('75% (150W)')
  })

  it('handles FTP of 250', () => {
    expect(formatPowerWithWatts(1.0, 250)).toBe('100% (250W)')
  })
})

describe('formatWatts', () => {
  it('calculates and formats watts', () => {
    expect(formatWatts(0.75, 200)).toBe('150W')
  })

  it('rounds to nearest integer', () => {
    expect(formatWatts(0.755, 200)).toBe('151W')
  })
})

describe('formatPowerRange', () => {
  it('formats power range', () => {
    expect(formatPowerRange(0.5, 0.75)).toBe('50-75%')
  })

  it('handles same values', () => {
    expect(formatPowerRange(0.75, 0.75)).toBe('75-75%')
  })
})

describe('formatPowerRangeWithWatts', () => {
  it('formats power range with watts', () => {
    expect(formatPowerRangeWithWatts(0.5, 0.75, 200)).toBe('50-75% (100-150W)')
  })
})

describe('parseDurationInput', () => {
  it('parses minutes with m suffix', () => {
    expect(parseDurationInput('5m')).toBe(300)
    expect(parseDurationInput('5 min')).toBe(300)
    expect(parseDurationInput('5 mins')).toBe(300)
    expect(parseDurationInput('5 minutes')).toBe(300)
  })

  it('parses hours with h suffix', () => {
    expect(parseDurationInput('1h')).toBe(3600)
    expect(parseDurationInput('1 hr')).toBe(3600)
    expect(parseDurationInput('1 hrs')).toBe(3600)
    expect(parseDurationInput('1 hour')).toBe(3600)
  })

  it('parses combined hours and minutes', () => {
    expect(parseDurationInput('1h30m')).toBe(5400)
    expect(parseDurationInput('1h 30m')).toBe(5400)
    expect(parseDurationInput('1hr30min')).toBe(5400)
  })

  it('parses mm:ss format', () => {
    expect(parseDurationInput('5:30')).toBe(330)
  })

  it('parses hh:mm:ss format', () => {
    expect(parseDurationInput('1:30:00')).toBe(5400)
  })

  it('parses plain number as minutes', () => {
    expect(parseDurationInput('10')).toBe(600)
  })

  it('returns null for invalid input', () => {
    expect(parseDurationInput('invalid')).toBeNull()
    expect(parseDurationInput('')).toBeNull()
  })

  it('handles whitespace', () => {
    expect(parseDurationInput('  5m  ')).toBe(300)
  })

  it('is case insensitive', () => {
    expect(parseDurationInput('5M')).toBe(300)
    expect(parseDurationInput('1H')).toBe(3600)
  })
})
