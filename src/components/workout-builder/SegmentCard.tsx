import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WorkoutSegment } from '../../types/workout';
import { DragHandleIcon, DuplicateIcon, TrashIcon } from '../ui/Icons';
import { getSegmentDuration } from '../../utils/workoutUtils';
import { formatDurationShort, formatPowerWithWatts, formatPowerRangeWithWatts } from '../../utils/formatters';
import { getColorForPower, getZoneName } from '../../utils/powerZones';
import { useSettingsStore } from '../../store/settingsStore';

interface SegmentCardProps {
  segment: WorkoutSegment;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const SEGMENT_TYPE_LABELS: Record<WorkoutSegment['type'], string> = {
  warmup: 'Warm Up',
  cooldown: 'Cool Down',
  steadystate: 'Steady State',
  intervals: 'Intervals',
  ramp: 'Ramp',
  freeride: 'Free Ride',
  maxeffort: 'Max Effort',
};

function getSegmentPowerDisplay(segment: WorkoutSegment, ftp: number): { text: string; avgPower: number } {
  switch (segment.type) {
    case 'warmup':
    case 'cooldown':
    case 'ramp':
      return {
        text: formatPowerRangeWithWatts(segment.powerLow, segment.powerHigh, ftp),
        avgPower: (segment.powerLow + segment.powerHigh) / 2,
      };
    case 'steadystate':
      return {
        text: formatPowerWithWatts(segment.power, ftp),
        avgPower: segment.power,
      };
    case 'intervals':
      return {
        text: `${segment.repeat}x ${formatPowerWithWatts(segment.onPower, ftp)}`,
        avgPower: segment.onPower,
      };
    case 'freeride':
      return { text: 'Free Ride', avgPower: 0.5 };
    case 'maxeffort':
      return { text: 'MAX Effort', avgPower: 1.5 };
    default:
      return { text: '-', avgPower: 0.5 };
  }
}

export function SegmentCard({
  segment,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SegmentCardProps) {
  const { ftp } = useSettingsStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const duration = getSegmentDuration(segment);
  const { text: powerText, avgPower } = getSegmentPowerDisplay(segment, ftp);
  const color = getColorForPower(avgPower);
  const zoneName = getZoneName(avgPower);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded-lg border-2 p-3 cursor-pointer transition-all duration-300 animate-slide-in
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
      `}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <DragHandleIcon />
      </div>

      <div className="ml-6">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {SEGMENT_TYPE_LABELS[segment.type]}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Duplicate"
            >
              <DuplicateIcon />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-500"
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {formatDurationShort(duration)}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-gray-700 dark:text-gray-300">
              {powerText}
            </span>
            <span className="text-xs text-gray-400">
              ({zoneName})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
