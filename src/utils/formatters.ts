const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const PERCENT_MULTIPLIER = 100;

function powerToPercent(power: number): number {
  return Math.round(power * PERCENT_MULTIPLIER);
}

function powerToWatts(power: number, ftp: number): number {
  return Math.round(power * ftp);
}

interface DurationParts {
  hours: number;
  minutes: number;
  seconds: number;
}

function parseDurationParts(totalSeconds: number): DurationParts {
  return {
    hours: Math.floor(totalSeconds / SECONDS_PER_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  };
}

export function formatDuration(seconds: number): string {
  const { hours, minutes, seconds: secs } = parseDurationParts(seconds);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationShort(seconds: number): string {
  const { hours, minutes } = parseDurationParts(seconds);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatPower(power: number): string {
  return `${powerToPercent(power)}%`;
}

export function formatPowerWithWatts(power: number, ftp: number): string {
  return `${powerToPercent(power)}% (${powerToWatts(power, ftp)}W)`;
}

export function formatWatts(power: number, ftp: number): string {
  return `${powerToWatts(power, ftp)}W`;
}

export function formatPowerRange(low: number, high: number): string {
  return `${powerToPercent(low)}-${powerToPercent(high)}%`;
}

export function formatPowerRangeWithWatts(low: number, high: number, ftp: number): string {
  return `${powerToPercent(low)}-${powerToPercent(high)}% (${powerToWatts(low, ftp)}-${powerToWatts(high, ftp)}W)`;
}

export function parseDurationInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  const minuteMatch = trimmed.match(/^(\d+)\s*(?:m|min|mins|minutes?)$/);
  if (minuteMatch) {
    return parseInt(minuteMatch[1], 10) * SECONDS_PER_MINUTE;
  }

  const hourMatch = trimmed.match(/^(\d+)\s*(?:h|hr|hrs|hours?)$/);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * SECONDS_PER_HOUR;
  }

  const hourMinMatch = trimmed.match(/^(\d+)\s*(?:h|hr)\s*(\d+)\s*(?:m|min)?$/);
  if (hourMinMatch) {
    const hours = parseInt(hourMinMatch[1], 10);
    const minutes = parseInt(hourMinMatch[2], 10);
    return hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE;
  }

  const colonMatch = trimmed.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (colonMatch) {
    if (colonMatch[3]) {
      const hours = parseInt(colonMatch[1], 10);
      const minutes = parseInt(colonMatch[2], 10);
      const seconds = parseInt(colonMatch[3], 10);
      return hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds;
    }
    const minutes = parseInt(colonMatch[1], 10);
    const seconds = parseInt(colonMatch[2], 10);
    return minutes * SECONDS_PER_MINUTE + seconds;
  }

  const plainNumber = parseInt(trimmed, 10);
  if (!isNaN(plainNumber)) {
    return plainNumber * SECONDS_PER_MINUTE;
  }

  return null;
}
