import { v4 as uuidv4 } from 'uuid';
import type { Workout, WorkoutSegment, SportType } from '../types/workout';

// Constants for file validation
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB
const SUPPORTED_EXTENSIONS = ['.zwo'];

// XML element names for segments
const SEGMENT_ELEMENT_NAMES = {
  WARMUP: 'Warmup',
  COOLDOWN: 'Cooldown',
  STEADY_STATE: 'SteadyState',
  INTERVALS: 'IntervalsT',
  RAMP: 'Ramp',
  FREE_RIDE: 'FreeRide',
  MAX_EFFORT: 'MaxEffort',
} as const;

export interface ZwoImportResult {
  success: true;
  workout: Workout;
}

export interface ZwoImportError {
  success: false;
  error: string;
}

export type ZwoImportResponse = ZwoImportResult | ZwoImportError;

function getElementText(parent: Element, tagName: string): string {
  const element = parent.querySelector(tagName);
  return element?.textContent?.trim() || '';
}

function getAttributeNumber(element: Element, attrName: string, defaultValue: number): number {
  const value = element.getAttribute(attrName);
  if (value === null) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getAttributeBoolean(element: Element, attrName: string): boolean {
  const value = element.getAttribute(attrName);
  return value === '1' || value?.toLowerCase() === 'true';
}

function parseSegment(element: Element): WorkoutSegment | null {
  const tagName = element.tagName;
  const baseSegment = { id: uuidv4() };

  // Parse optional cadence (common to all segments)
  const cadence = getAttributeNumber(element, 'Cadence', 0);
  const cadenceHigh = getAttributeNumber(element, 'CadenceHigh', 0);
  const cadenceLow = getAttributeNumber(element, 'CadenceLow', 0);
  const cadenceFields = {
    ...(cadence > 0 && { cadence }),
    ...(cadenceHigh > 0 && { cadenceHigh }),
    ...(cadenceLow > 0 && { cadenceLow }),
  };

  switch (tagName) {
    case SEGMENT_ELEMENT_NAMES.WARMUP:
      return {
        ...baseSegment,
        type: 'warmup',
        duration: getAttributeNumber(element, 'Duration', 600),
        powerLow: getAttributeNumber(element, 'PowerLow', 0.4),
        powerHigh: getAttributeNumber(element, 'PowerHigh', 0.7),
        ...cadenceFields,
      };

    case SEGMENT_ELEMENT_NAMES.COOLDOWN:
      // ZWO format: PowerLow = start power, PowerHigh = end power
      // For cooldown in Zwift: starts high, ends low
      // So we swap back when importing to maintain our internal representation
      return {
        ...baseSegment,
        type: 'cooldown',
        duration: getAttributeNumber(element, 'Duration', 300),
        powerLow: getAttributeNumber(element, 'PowerHigh', 0.4), // Swap back
        powerHigh: getAttributeNumber(element, 'PowerLow', 0.6), // Swap back
        ...cadenceFields,
      };

    case SEGMENT_ELEMENT_NAMES.STEADY_STATE:
      return {
        ...baseSegment,
        type: 'steadystate',
        duration: getAttributeNumber(element, 'Duration', 300),
        power: getAttributeNumber(element, 'Power', 0.75),
        ...cadenceFields,
      };

    case SEGMENT_ELEMENT_NAMES.INTERVALS:
      return {
        ...baseSegment,
        type: 'intervals',
        repeat: getAttributeNumber(element, 'Repeat', 4),
        onDuration: getAttributeNumber(element, 'OnDuration', 60),
        offDuration: getAttributeNumber(element, 'OffDuration', 60),
        onPower: getAttributeNumber(element, 'OnPower', 1.0),
        offPower: getAttributeNumber(element, 'OffPower', 0.5),
        ...cadenceFields,
      };

    case SEGMENT_ELEMENT_NAMES.RAMP:
      return {
        ...baseSegment,
        type: 'ramp',
        duration: getAttributeNumber(element, 'Duration', 300),
        powerLow: getAttributeNumber(element, 'PowerLow', 0.5),
        powerHigh: getAttributeNumber(element, 'PowerHigh', 1.0),
        ...cadenceFields,
      };

    case SEGMENT_ELEMENT_NAMES.FREE_RIDE:
      return {
        ...baseSegment,
        type: 'freeride',
        duration: getAttributeNumber(element, 'Duration', 600),
        flatRoad: getAttributeBoolean(element, 'FlatRoad'),
        ...cadenceFields,
      };

    case SEGMENT_ELEMENT_NAMES.MAX_EFFORT:
      return {
        ...baseSegment,
        type: 'maxeffort',
        duration: getAttributeNumber(element, 'Duration', 30),
        ...cadenceFields,
      };

    default:
      return null;
  }
}

function parseTags(workoutFile: Element): string[] {
  const tagsElement = workoutFile.querySelector('tags');
  if (!tagsElement) return [];

  const tagElements = tagsElement.querySelectorAll('tag');
  return Array.from(tagElements)
    .map((tag) => tag.getAttribute('name'))
    .filter((name): name is string => name !== null && name.length > 0);
}

function parseSegments(workoutElement: Element): WorkoutSegment[] {
  const segments: WorkoutSegment[] = [];
  const children = workoutElement.children;

  for (let i = 0; i < children.length; i++) {
    const segment = parseSegment(children[i]);
    if (segment) {
      segments.push(segment);
    }
  }

  return segments;
}

export function parseZwoContent(xmlContent: string): ZwoImportResponse {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    // Check for XML parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return { success: false, error: 'Invalid XML format. Please check the file structure.' };
    }

    const workoutFile = doc.querySelector('workout_file');
    if (!workoutFile) {
      return { success: false, error: 'Missing workout_file element. This may not be a valid ZWO file.' };
    }

    const workoutElement = workoutFile.querySelector('workout');
    if (!workoutElement) {
      return { success: false, error: 'Missing workout element. The file structure is incomplete.' };
    }

    // Parse metadata
    const name = getElementText(workoutFile, 'name') || 'Imported Workout';
    const description = getElementText(workoutFile, 'description');
    const author = getElementText(workoutFile, 'author');
    const sportTypeRaw = getElementText(workoutFile, 'sportType').toLowerCase();
    const sportType: SportType = sportTypeRaw === 'run' ? 'run' : 'bike';

    // Parse tags
    const tags = parseTags(workoutFile);

    // Parse segments
    const segments = parseSegments(workoutElement);

    if (segments.length === 0) {
      return { success: false, error: 'No valid workout segments found in the file.' };
    }

    const now = new Date().toISOString();
    const workout: Workout = {
      id: uuidv4(),
      name,
      description,
      author,
      sportType,
      segments,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    return { success: true, workout };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: `Failed to parse ZWO file: ${message}` };
  }
}

export function validateZwoFile(file: File): string | null {
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return 'Please select a .zwo file';
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is too large. Maximum size is 1MB';
  }

  return null;
}

export async function importZwoFile(file: File): Promise<ZwoImportResponse> {
  // Validate file first
  const validationError = validateZwoFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const content = await file.text();
    return parseZwoContent(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: `Failed to read file: ${message}` };
  }
}
