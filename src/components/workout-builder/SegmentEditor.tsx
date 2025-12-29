import { useState } from 'react';
import type { WorkoutSegment } from '../../types/workout';
import { Input } from '../ui/Input';
import { Slider } from '../ui/Slider';
import { CloseIcon } from '../ui/Icons';
import { formatPowerWithWatts, formatDurationShort } from '../../utils/formatters';
import { useSettingsStore } from '../../store/settingsStore';

interface SegmentEditorProps {
  segment: WorkoutSegment;
  onUpdate: (updates: Partial<WorkoutSegment>) => void;
  onClose: () => void;
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

const MIN_DURATION_SECONDS = 10;
const MAX_DURATION_SECONDS = 3600;
const MAX_INTERVAL_DURATION_SECONDS = 600;
const DURATION_STEP_SECONDS = 10;
const INTERVAL_DURATION_STEP_SECONDS = 5;
const MIN_POWER = 0.2;
const MAX_POWER = 2.0;
const POWER_STEP = 0.01;
const MIN_REPEAT = 1;
const MAX_REPEAT = 30;

export function SegmentEditor({ segment, onUpdate, onClose }: SegmentEditorProps) {
  const { ftp } = useSettingsStore();
  const [localDuration, setLocalDuration] = useState(
    () => ('duration' in segment ? segment.duration : 0)
  );

  const formatPowerValue = (power: number) => formatPowerWithWatts(power, ftp);

  const handleDurationChange = (value: number) => {
    setLocalDuration(value);
    onUpdate({ duration: value } as Partial<WorkoutSegment>);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Edit {SEGMENT_TYPE_LABELS[segment.type]}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Close editor"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {'duration' in segment && (
          <Slider
            label="Duration"
            min={MIN_DURATION_SECONDS}
            max={MAX_DURATION_SECONDS}
            step={DURATION_STEP_SECONDS}
            value={localDuration}
            onChange={(e) => handleDurationChange(Number(e.target.value))}
            formatValue={(v) => formatDurationShort(v)}
          />
        )}

        {segment.type === 'steadystate' && (
          <Slider
            label="Power"
            min={MIN_POWER}
            max={MAX_POWER}
            step={POWER_STEP}
            value={segment.power}
            onChange={(e) => onUpdate({ power: Number(e.target.value) })}
            formatValue={formatPowerValue}
          />
        )}

        {(segment.type === 'warmup' || segment.type === 'ramp') && (
          <>
            <Slider
              label="Start Power"
              min={MIN_POWER}
              max={MAX_POWER}
              step={POWER_STEP}
              value={segment.powerLow}
              onChange={(e) => onUpdate({ powerLow: Number(e.target.value) })}
              formatValue={formatPowerValue}
            />
            <Slider
              label="End Power"
              min={MIN_POWER}
              max={MAX_POWER}
              step={POWER_STEP}
              value={segment.powerHigh}
              onChange={(e) => onUpdate({ powerHigh: Number(e.target.value) })}
              formatValue={formatPowerValue}
            />
          </>
        )}

        {segment.type === 'cooldown' && (
          <>
            <Slider
              label="Start Power"
              min={MIN_POWER}
              max={MAX_POWER}
              step={POWER_STEP}
              value={segment.powerHigh}
              onChange={(e) => onUpdate({ powerHigh: Number(e.target.value) })}
              formatValue={formatPowerValue}
            />
            <Slider
              label="End Power"
              min={MIN_POWER}
              max={MAX_POWER}
              step={POWER_STEP}
              value={segment.powerLow}
              onChange={(e) => onUpdate({ powerLow: Number(e.target.value) })}
              formatValue={formatPowerValue}
            />
          </>
        )}

        {segment.type === 'intervals' && (
          <>
            <Slider
              label="Repeats"
              min={MIN_REPEAT}
              max={MAX_REPEAT}
              step={1}
              value={segment.repeat}
              onChange={(e) => onUpdate({ repeat: Number(e.target.value) })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Slider
                label="On Duration"
                min={MIN_DURATION_SECONDS}
                max={MAX_INTERVAL_DURATION_SECONDS}
                step={INTERVAL_DURATION_STEP_SECONDS}
                value={segment.onDuration}
                onChange={(e) => onUpdate({ onDuration: Number(e.target.value) })}
                formatValue={(v) => formatDurationShort(v)}
              />
              <Slider
                label="Off Duration"
                min={MIN_DURATION_SECONDS}
                max={MAX_INTERVAL_DURATION_SECONDS}
                step={INTERVAL_DURATION_STEP_SECONDS}
                value={segment.offDuration}
                onChange={(e) => onUpdate({ offDuration: Number(e.target.value) })}
                formatValue={(v) => formatDurationShort(v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Slider
                label="On Power"
                min={MIN_POWER}
                max={MAX_POWER}
                step={POWER_STEP}
                value={segment.onPower}
                onChange={(e) => onUpdate({ onPower: Number(e.target.value) })}
                formatValue={formatPowerValue}
              />
              <Slider
                label="Off Power"
                min={MIN_POWER}
                max={MAX_POWER}
                step={POWER_STEP}
                value={segment.offPower}
                onChange={(e) => onUpdate({ offPower: Number(e.target.value) })}
                formatValue={formatPowerValue}
              />
            </div>
          </>
        )}

        {segment.type === 'freeride' && (
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={segment.flatRoad || false}
              onChange={(e) => onUpdate({ flatRoad: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Flat road (no terrain)
          </label>
        )}

        {segment.type !== 'freeride' && segment.type !== 'maxeffort' && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Input
              label="Target Cadence (optional)"
              type="number"
              min={40}
              max={150}
              value={segment.cadence || ''}
              onChange={(e) =>
                onUpdate({
                  cadence: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="e.g., 90"
            />
          </div>
        )}
      </div>
    </div>
  );
}
