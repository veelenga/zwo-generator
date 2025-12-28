import { z } from 'zod';

// Validation constants
const MIN_POWER = 0.2;
const MAX_POWER = 2.0;
const MIN_DURATION_SECONDS = 10;
const MAX_DURATION_SECONDS = 7200; // 2 hours
const MIN_REPEAT = 1;
const MAX_REPEAT = 50;
const MIN_CADENCE = 40;
const MAX_CADENCE = 150;
const MAX_PROMPT_LENGTH = 1000;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

// Control characters pattern (excluding tab, newline, carriage return)
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Input sanitization
export function sanitizePrompt(input: string): string {
  return input.trim().slice(0, MAX_PROMPT_LENGTH).replace(CONTROL_CHARS_REGEX, '');
}

export function isPromptValid(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_PROMPT_LENGTH;
}

export { MAX_PROMPT_LENGTH };

// Base segment fields (without id for AI response validation)
const cadenceFields = {
  cadence: z.number().min(MIN_CADENCE).max(MAX_CADENCE).optional(),
  cadenceHigh: z.number().min(MIN_CADENCE).max(MAX_CADENCE).optional(),
  cadenceLow: z.number().min(MIN_CADENCE).max(MAX_CADENCE).optional(),
};

const powerSchema = z.number().min(MIN_POWER).max(MAX_POWER);
const durationSchema = z.number().min(MIN_DURATION_SECONDS).max(MAX_DURATION_SECONDS);

// Individual segment schemas (without id - for AI response)
const warmupSegmentSchema = z.object({
  type: z.literal('warmup'),
  duration: durationSchema,
  powerLow: powerSchema,
  powerHigh: powerSchema,
  ...cadenceFields,
});

const cooldownSegmentSchema = z.object({
  type: z.literal('cooldown'),
  duration: durationSchema,
  powerLow: powerSchema,
  powerHigh: powerSchema,
  ...cadenceFields,
});

const steadyStateSegmentSchema = z.object({
  type: z.literal('steadystate'),
  duration: durationSchema,
  power: powerSchema,
  ...cadenceFields,
});

const intervalsSegmentSchema = z.object({
  type: z.literal('intervals'),
  repeat: z.number().min(MIN_REPEAT).max(MAX_REPEAT),
  onDuration: durationSchema,
  offDuration: durationSchema,
  onPower: powerSchema,
  offPower: powerSchema,
  ...cadenceFields,
});

const rampSegmentSchema = z.object({
  type: z.literal('ramp'),
  duration: durationSchema,
  powerLow: powerSchema,
  powerHigh: powerSchema,
  ...cadenceFields,
});

const freeRideSegmentSchema = z.object({
  type: z.literal('freeride'),
  duration: durationSchema,
  flatRoad: z.boolean().optional(),
  ...cadenceFields,
});

const maxEffortSegmentSchema = z.object({
  type: z.literal('maxeffort'),
  duration: durationSchema,
  ...cadenceFields,
});

// Union of all segment types (without id)
const workoutSegmentWithoutIdSchema = z.discriminatedUnion('type', [
  warmupSegmentSchema,
  cooldownSegmentSchema,
  steadyStateSegmentSchema,
  intervalsSegmentSchema,
  rampSegmentSchema,
  freeRideSegmentSchema,
  maxEffortSegmentSchema,
]);

// Schema for AI-generated workout response
export const generatedWorkoutSchema = z.object({
  name: z.string().min(1).max(MAX_NAME_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).default(''),
  segments: z.array(workoutSegmentWithoutIdSchema).min(1).max(50),
});

export type ValidatedGeneratedWorkout = z.infer<typeof generatedWorkoutSchema>;

// Validation result type (discriminated union for type safety)
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Validate AI response
export function validateGeneratedWorkout(data: unknown): ValidationResult<ValidatedGeneratedWorkout> {
  const result = generatedWorkoutSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  return { success: false, error: `Invalid workout data: ${errorMessages}` };
}
