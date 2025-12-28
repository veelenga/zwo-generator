import type { Workout, WorkoutSegment, IntervalsSegment } from '../types/workout';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatPower(power: number): string {
  return power.toFixed(2);
}

function segmentToXml(segment: WorkoutSegment, indent: string): string {
  switch (segment.type) {
    case 'warmup':
      return `${indent}<Warmup Duration="${segment.duration}" PowerLow="${formatPower(segment.powerLow)}" PowerHigh="${formatPower(segment.powerHigh)}"${segment.cadence ? ` Cadence="${segment.cadence}"` : ''}/>`;

    case 'cooldown':
      return `${indent}<Cooldown Duration="${segment.duration}" PowerLow="${formatPower(segment.powerLow)}" PowerHigh="${formatPower(segment.powerHigh)}"${segment.cadence ? ` Cadence="${segment.cadence}"` : ''}/>`;

    case 'steadystate':
      return `${indent}<SteadyState Duration="${segment.duration}" Power="${formatPower(segment.power)}"${segment.cadence ? ` Cadence="${segment.cadence}"` : ''}/>`;

    case 'intervals': {
      const intervals = segment as IntervalsSegment;
      return `${indent}<IntervalsT Repeat="${intervals.repeat}" OnDuration="${intervals.onDuration}" OffDuration="${intervals.offDuration}" OnPower="${formatPower(intervals.onPower)}" OffPower="${formatPower(intervals.offPower)}"${segment.cadence ? ` Cadence="${segment.cadence}"` : ''}/>`;
    }

    case 'ramp':
      return `${indent}<Ramp Duration="${segment.duration}" PowerLow="${formatPower(segment.powerLow)}" PowerHigh="${formatPower(segment.powerHigh)}"${segment.cadence ? ` Cadence="${segment.cadence}"` : ''}/>`;

    case 'freeride':
      return `${indent}<FreeRide Duration="${segment.duration}"${segment.flatRoad ? ' FlatRoad="1"' : ''}/>`;

    case 'maxeffort':
      return `${indent}<MaxEffort Duration="${segment.duration}"/>`;

    default:
      return '';
  }
}

export function workoutToZwo(workout: Workout): string {
  const indent = '        ';
  const segmentIndent = '            ';

  const segmentsXml = workout.segments
    .map((segment) => segmentToXml(segment, segmentIndent))
    .filter(Boolean)
    .join('\n');

  const tagsXml = workout.tags.length > 0
    ? `\n${indent}<tags>\n${workout.tags.map((tag) => `${segmentIndent}<tag name="${escapeXml(tag)}"/>`).join('\n')}\n${indent}</tags>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
        <author>${escapeXml(workout.author)}</author>
        <name>${escapeXml(workout.name)}</name>
        <description>${escapeXml(workout.description)}</description>
        <sportType>${workout.sportType}</sportType>${tagsXml}
        <workout>
${segmentsXml}
        </workout>
</workout_file>`;
}

export function downloadZwoFile(workout: Workout): void {
  const zwoContent = workoutToZwo(workout);
  const blob = new Blob([zwoContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const filename = workout.name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename || 'workout'}.zwo`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyZwoToClipboard(workout: Workout): Promise<void> {
  const zwoContent = workoutToZwo(workout);
  return navigator.clipboard.writeText(zwoContent);
}
