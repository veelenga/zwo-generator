import { useWorkoutStore } from '../../store/workoutStore';
import { useHistory } from '../../hooks/useHistory';
import { getTotalDuration, estimateTSS } from '../../utils/workoutUtils';
import { formatDurationShort } from '../../utils/formatters';
import { WorkoutChart } from './WorkoutChart';
import { SegmentList } from './SegmentList';
import { SegmentEditor } from './SegmentEditor';
import { AddSegmentButton } from './AddSegmentButton';
import { EmptyState } from './EmptyState';
import { AiPanel } from '../ai/AiPanel';
import type { WorkoutSegment } from '../../types/workout';

interface WorkoutBuilderProps {
  onExampleClick: (prompt: string) => void;
}

export function WorkoutBuilder({ onExampleClick }: WorkoutBuilderProps) {
  const {
    workout,
    selectedSegmentId,
    addSegment,
    updateSegment,
    removeSegment,
    duplicateSegmentById,
    moveSegment,
    selectSegment,
  } = useWorkoutStore();

  useHistory();

  const selectedSegment = workout.segments.find((s) => s.id === selectedSegmentId);
  const totalDuration = getTotalDuration(workout.segments);
  const estimatedTss = estimateTSS(workout.segments);

  const handleAddSegment = (type: WorkoutSegment['type']) => {
    addSegment(type);
  };

  const handleSelectSegment = (id: string) => {
    selectSegment(selectedSegmentId === id ? null : id);
  };

  const handleUpdateSegment = (updates: Partial<WorkoutSegment>) => {
    if (selectedSegmentId) {
      updateSegment(selectedSegmentId, updates);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workout Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <WorkoutChart
          segments={workout.segments}
          selectedSegmentId={selectedSegmentId}
          onSegmentClick={handleSelectSegment}
          height={200}
        />

        {/* Stats bar */}
        {workout.segments.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Duration: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatDurationShort(totalDuration)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">TSS: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ~{estimatedTss}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Segments: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {workout.segments.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Empty state or builder content */}
      {workout.segments.length === 0 ? (
        <EmptyState onExampleClick={onExampleClick} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Segment List */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Segments
            </h3>
            <SegmentList
              segments={workout.segments}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={handleSelectSegment}
              onDeleteSegment={removeSegment}
              onDuplicateSegment={duplicateSegmentById}
              onMoveSegment={moveSegment}
            />
            <AddSegmentButton onAddSegment={handleAddSegment} />
          </div>

          {/* Segment Editor / AI Panel */}
          <div className="space-y-4">
            {selectedSegment ? (
              <>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Edit Segment
                </h3>
                <SegmentEditor
                  key={selectedSegment.id}
                  segment={selectedSegment}
                  onUpdate={handleUpdateSegment}
                  onClose={() => selectSegment(null)}
                />
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Refine with AI
                  </h3>
                  <AiPanel />
                </div>
              </>
            ) : (
              <>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Refine with AI
                </h3>
                <AiPanel />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
