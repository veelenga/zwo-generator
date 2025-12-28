import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkoutStore } from './workoutStore'
import type { Workout, SteadyStateSegment } from '../types/workout'

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}))

describe('workoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      workout: {
        id: 'test-workout',
        name: 'Test Workout',
        description: '',
        author: '',
        sportType: 'bike',
        segments: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      selectedSegmentId: null,
      isGenerating: false,
    })
  })

  describe('setWorkout', () => {
    it('replaces the entire workout', () => {
      const newWorkout: Workout = {
        id: 'new-workout',
        name: 'New Workout',
        description: 'A new workout',
        author: 'Tester',
        sportType: 'run',
        segments: [],
        tags: ['test'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      useWorkoutStore.getState().setWorkout(newWorkout)

      expect(useWorkoutStore.getState().workout).toEqual(newWorkout)
    })

    it('clears selected segment', () => {
      useWorkoutStore.setState({ selectedSegmentId: 'some-id' })
      const newWorkout: Workout = {
        id: 'new-workout',
        name: 'New Workout',
        description: '',
        author: '',
        sportType: 'bike',
        segments: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      useWorkoutStore.getState().setWorkout(newWorkout)

      expect(useWorkoutStore.getState().selectedSegmentId).toBeNull()
    })
  })

  describe('updateWorkout', () => {
    it('updates partial workout properties', () => {
      useWorkoutStore.getState().updateWorkout({ name: 'Updated Name' })

      expect(useWorkoutStore.getState().workout.name).toBe('Updated Name')
      expect(useWorkoutStore.getState().workout.id).toBe('test-workout')
    })

    it('updates the updatedAt timestamp', () => {
      const before = useWorkoutStore.getState().workout.updatedAt

      useWorkoutStore.getState().updateWorkout({ name: 'Updated' })

      expect(useWorkoutStore.getState().workout.updatedAt).not.toBe(before)
    })
  })

  describe('setSegments', () => {
    it('replaces all segments', () => {
      const newSegments: SteadyStateSegment[] = [
        { id: '1', type: 'steadystate', duration: 300, power: 0.75 },
        { id: '2', type: 'steadystate', duration: 600, power: 0.85 },
      ]

      useWorkoutStore.getState().setSegments(newSegments)

      expect(useWorkoutStore.getState().workout.segments).toEqual(newSegments)
    })
  })

  describe('addSegment', () => {
    it('adds segment to end by default', () => {
      useWorkoutStore.getState().addSegment('steadystate')

      const segments = useWorkoutStore.getState().workout.segments
      expect(segments).toHaveLength(1)
      expect(segments[0].type).toBe('steadystate')
    })

    it('adds segment at specific index', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [
            { id: '1', type: 'warmup', duration: 600, powerLow: 0.4, powerHigh: 0.7 },
            { id: '2', type: 'cooldown', duration: 300, powerLow: 0.6, powerHigh: 0.4 },
          ],
        },
      })

      useWorkoutStore.getState().addSegment('steadystate', 1)

      const segments = useWorkoutStore.getState().workout.segments
      expect(segments).toHaveLength(3)
      expect(segments[1].type).toBe('steadystate')
    })

    it('selects the newly added segment', () => {
      useWorkoutStore.getState().addSegment('steadystate')

      const selectedId = useWorkoutStore.getState().selectedSegmentId
      const segments = useWorkoutStore.getState().workout.segments
      expect(selectedId).toBe(segments[0].id)
    })
  })

  describe('updateSegment', () => {
    it('updates segment by id', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [{ id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 }],
        },
      })

      useWorkoutStore.getState().updateSegment('seg-1', { power: 0.85 })

      const segment = useWorkoutStore.getState().workout.segments[0] as SteadyStateSegment
      expect(segment.power).toBe(0.85)
    })

    it('does not affect other segments', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [
            { id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 },
            { id: 'seg-2', type: 'steadystate', duration: 600, power: 0.85 },
          ],
        },
      })

      useWorkoutStore.getState().updateSegment('seg-1', { power: 0.9 })

      const segments = useWorkoutStore.getState().workout.segments
      expect((segments[1] as SteadyStateSegment).power).toBe(0.85)
    })
  })

  describe('removeSegment', () => {
    it('removes segment by id', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [
            { id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 },
            { id: 'seg-2', type: 'steadystate', duration: 600, power: 0.85 },
          ],
        },
      })

      useWorkoutStore.getState().removeSegment('seg-1')

      const segments = useWorkoutStore.getState().workout.segments
      expect(segments).toHaveLength(1)
      expect(segments[0].id).toBe('seg-2')
    })

    it('clears selection if removed segment was selected', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [{ id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 }],
        },
        selectedSegmentId: 'seg-1',
      })

      useWorkoutStore.getState().removeSegment('seg-1')

      expect(useWorkoutStore.getState().selectedSegmentId).toBeNull()
    })

    it('keeps selection if different segment removed', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [
            { id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 },
            { id: 'seg-2', type: 'steadystate', duration: 600, power: 0.85 },
          ],
        },
        selectedSegmentId: 'seg-2',
      })

      useWorkoutStore.getState().removeSegment('seg-1')

      expect(useWorkoutStore.getState().selectedSegmentId).toBe('seg-2')
    })
  })

  describe('duplicateSegmentById', () => {
    it('duplicates segment after the original', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [
            { id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 },
            { id: 'seg-2', type: 'steadystate', duration: 600, power: 0.85 },
          ],
        },
      })

      useWorkoutStore.getState().duplicateSegmentById('seg-1')

      const segments = useWorkoutStore.getState().workout.segments
      expect(segments).toHaveLength(3)
      expect(segments[1].type).toBe('steadystate')
      expect((segments[1] as SteadyStateSegment).power).toBe(0.75)
    })

    it('selects the duplicated segment', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [{ id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 }],
        },
      })

      useWorkoutStore.getState().duplicateSegmentById('seg-1')

      const selectedId = useWorkoutStore.getState().selectedSegmentId
      expect(selectedId).not.toBe('seg-1')
    })

    it('does nothing for non-existent segment', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [{ id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 }],
        },
      })

      useWorkoutStore.getState().duplicateSegmentById('non-existent')

      expect(useWorkoutStore.getState().workout.segments).toHaveLength(1)
    })
  })

  describe('moveSegment', () => {
    it('moves segment from one position to another', () => {
      useWorkoutStore.setState({
        workout: {
          ...useWorkoutStore.getState().workout,
          segments: [
            { id: 'seg-1', type: 'warmup', duration: 600, powerLow: 0.4, powerHigh: 0.7 },
            { id: 'seg-2', type: 'steadystate', duration: 300, power: 0.75 },
            { id: 'seg-3', type: 'cooldown', duration: 300, powerLow: 0.6, powerHigh: 0.4 },
          ],
        },
      })

      useWorkoutStore.getState().moveSegment(0, 2)

      const segments = useWorkoutStore.getState().workout.segments
      expect(segments[0].id).toBe('seg-2')
      expect(segments[1].id).toBe('seg-3')
      expect(segments[2].id).toBe('seg-1')
    })
  })

  describe('selectSegment', () => {
    it('sets selected segment id', () => {
      useWorkoutStore.getState().selectSegment('seg-1')
      expect(useWorkoutStore.getState().selectedSegmentId).toBe('seg-1')
    })

    it('clears selection when null', () => {
      useWorkoutStore.setState({ selectedSegmentId: 'seg-1' })
      useWorkoutStore.getState().selectSegment(null)
      expect(useWorkoutStore.getState().selectedSegmentId).toBeNull()
    })
  })

  describe('setIsGenerating', () => {
    it('sets generating state', () => {
      useWorkoutStore.getState().setIsGenerating(true)
      expect(useWorkoutStore.getState().isGenerating).toBe(true)

      useWorkoutStore.getState().setIsGenerating(false)
      expect(useWorkoutStore.getState().isGenerating).toBe(false)
    })
  })

  describe('resetWorkout', () => {
    it('creates a new empty workout', () => {
      useWorkoutStore.setState({
        workout: {
          id: 'old-id',
          name: 'Old Workout',
          description: 'Old description',
          author: 'Old author',
          sportType: 'run',
          segments: [{ id: 'seg-1', type: 'steadystate', duration: 300, power: 0.75 }],
          tags: ['old'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        selectedSegmentId: 'seg-1',
      })

      useWorkoutStore.getState().resetWorkout()

      const workout = useWorkoutStore.getState().workout
      expect(workout.name).toBe('New Workout')
      expect(workout.segments).toEqual([])
      expect(useWorkoutStore.getState().selectedSegmentId).toBeNull()
    })
  })
})
