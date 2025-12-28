export type SportType = 'bike' | 'run';

export type SegmentType =
  | 'warmup'
  | 'cooldown'
  | 'steadystate'
  | 'intervals'
  | 'ramp'
  | 'freeride'
  | 'maxeffort';

export interface BaseSegment {
  id: string;
  type: SegmentType;
  cadence?: number;
  cadenceHigh?: number;
  cadenceLow?: number;
}

export interface WarmupSegment extends BaseSegment {
  type: 'warmup';
  duration: number;
  powerLow: number;
  powerHigh: number;
}

export interface CooldownSegment extends BaseSegment {
  type: 'cooldown';
  duration: number;
  powerLow: number;
  powerHigh: number;
}

export interface SteadyStateSegment extends BaseSegment {
  type: 'steadystate';
  duration: number;
  power: number;
}

export interface IntervalsSegment extends BaseSegment {
  type: 'intervals';
  repeat: number;
  onDuration: number;
  offDuration: number;
  onPower: number;
  offPower: number;
}

export interface RampSegment extends BaseSegment {
  type: 'ramp';
  duration: number;
  powerLow: number;
  powerHigh: number;
}

export interface FreeRideSegment extends BaseSegment {
  type: 'freeride';
  duration: number;
  flatRoad?: boolean;
}

export interface MaxEffortSegment extends BaseSegment {
  type: 'maxeffort';
  duration: number;
}

export type WorkoutSegment =
  | WarmupSegment
  | CooldownSegment
  | SteadyStateSegment
  | IntervalsSegment
  | RampSegment
  | FreeRideSegment
  | MaxEffortSegment;

export interface Workout {
  id: string;
  name: string;
  description: string;
  author: string;
  sportType: SportType;
  segments: WorkoutSegment[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutVersion {
  id: string;
  workoutSnapshot: Workout;
  timestamp: string;
  source: 'manual' | 'ai';
  description?: string;
}

export type PowerZone = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6' | 'z7';
