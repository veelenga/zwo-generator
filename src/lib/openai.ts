import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import type { Workout, WorkoutSegment } from '../types/workout';
import { SYSTEM_PROMPT, buildGeneratePrompt, buildRefinePrompt } from './prompts';

const OPENAI_MODEL = 'gpt-4o';
const OPENAI_TEMPERATURE = 0.7;
const OPENAI_MAX_TOKENS = 2000;

interface GeneratedWorkout {
  name: string;
  description: string;
  segments: Omit<WorkoutSegment, 'id'>[];
}

interface AIResponse {
  workout: Workout;
  interpretation: string;
}

interface GenerateOptions {
  apiKey: string;
  prompt: string;
  ftp: number;
  existingWorkout?: Workout;
}

function addIdsToSegments(segments: Omit<WorkoutSegment, 'id'>[]): WorkoutSegment[] {
  return segments.map((segment) => ({
    ...segment,
    id: uuidv4(),
  })) as WorkoutSegment[];
}

function stripSegmentIds(segments: WorkoutSegment[]): Omit<WorkoutSegment, 'id'>[] {
  return segments.map((segment) => {
    const copy = { ...segment };
    delete (copy as Record<string, unknown>).id;
    return copy as Omit<WorkoutSegment, 'id'>;
  });
}

function parseAIResponse(content: string): GeneratedWorkout {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.name || !Array.isArray(parsed.segments)) {
    throw new Error('Invalid workout structure in response');
  }

  return parsed as GeneratedWorkout;
}

export async function generateWorkout(options: GenerateOptions): Promise<AIResponse> {
  const { apiKey, prompt, ftp, existingWorkout } = options;

  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const userPrompt = existingWorkout
    ? buildRefinePrompt(
        prompt,
        {
          name: existingWorkout.name,
          description: existingWorkout.description,
          segments: stripSegmentIds(existingWorkout.segments),
        },
        ftp
      )
    : buildGeneratePrompt(prompt, ftp);

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: OPENAI_TEMPERATURE,
    max_tokens: OPENAI_MAX_TOKENS,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from AI');
  }

  const generatedWorkout = parseAIResponse(content);

  const now = new Date().toISOString();
  const workout: Workout = {
    id: existingWorkout?.id || uuidv4(),
    name: generatedWorkout.name,
    description: generatedWorkout.description,
    author: existingWorkout?.author || '',
    sportType: existingWorkout?.sportType || 'bike',
    segments: addIdsToSegments(generatedWorkout.segments),
    tags: existingWorkout?.tags || [],
    createdAt: existingWorkout?.createdAt || now,
    updatedAt: now,
  };

  const interpretation = existingWorkout
    ? `Modified workout: ${generatedWorkout.name}`
    : `Created workout: ${generatedWorkout.name}`;

  return { workout, interpretation };
}
