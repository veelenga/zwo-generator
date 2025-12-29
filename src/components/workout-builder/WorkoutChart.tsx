import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { WorkoutSegment } from '../../types/workout';
import { getSegmentDuration } from '../../utils/workoutUtils';
import { getColorForPower } from '../../utils/powerZones';
import { formatDuration, formatPower, formatDurationShort } from '../../utils/formatters';
import {
  getSegmentPath,
  calculateXAxisTicks,
  POWER_DISPLAY_RANGE,
} from '../../utils/chartUtils';
import { useSettingsStore } from '../../store/settingsStore';

const SEGMENT_TYPE_LABELS: Record<WorkoutSegment['type'], string> = {
  warmup: 'Warm Up',
  cooldown: 'Cool Down',
  steadystate: 'Steady State',
  intervals: 'Intervals',
  ramp: 'Ramp',
  freeride: 'Free Ride',
  maxeffort: 'Max Effort',
};

interface WorkoutChartProps {
  segments: WorkoutSegment[];
  selectedSegmentId: string | null;
  onSegmentClick: (id: string) => void;
  height?: number;
}

const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const CHART_WIDTH = 800;
const Y_AXIS_TICKS = [0, 0.5, 0.75, 1.0, 1.25, 1.5];
const SELECTED_SEGMENT_COLOR = '#1d4ed8';
const FTP_LINE_POWER = 1;

interface ChartSegment {
  id: string;
  x: number;
  width: number;
  points: string;
  color: string;
  avgPower: number;
  tooltip: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
  containerWidth: number;
}

export function WorkoutChart({
  segments,
  selectedSegmentId,
  onSegmentClick,
  height = 200,
}: WorkoutChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: '', containerWidth: 0 });
  const [canHover, setCanHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
  );
  const { ftp } = useSettingsStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)');
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const totalDuration = useMemo(
    () => segments.reduce((sum, seg) => sum + getSegmentDuration(seg), 0),
    [segments]
  );

  const powerToY = useCallback((power: number) => {
    const normalized = (power - POWER_DISPLAY_RANGE.min) / (POWER_DISPLAY_RANGE.max - POWER_DISPLAY_RANGE.min);
    return CHART_PADDING.top + innerHeight * (1 - normalized);
  }, [innerHeight]);

  const formatPowerWithWatts = useCallback((power: number): string => {
    const watts = Math.round(power * ftp);
    return `${formatPower(power)} (${watts}W)`;
  }, [ftp]);

  const getSegmentTooltip = useCallback((segment: WorkoutSegment, duration: number, avgPower: number): string => {
    const type = SEGMENT_TYPE_LABELS[segment.type];
    const durationStr = formatDurationShort(duration);

    if (segment.type === 'intervals') {
      const onPower = formatPowerWithWatts(segment.onPower);
      const offPower = formatPowerWithWatts(segment.offPower);
      return `${type} · ${durationStr}\n${segment.repeat} reps at ${onPower}\nRest at ${offPower}`;
    }

    if (segment.type === 'ramp' || segment.type === 'warmup' || segment.type === 'cooldown') {
      const startPower = formatPowerWithWatts(segment.powerLow);
      const endPower = formatPowerWithWatts(segment.powerHigh);
      return `${type} · ${durationStr}\n${startPower} → ${endPower}`;
    }

    if (segment.type === 'freeride') {
      return `${type} · ${durationStr}\nRide at your own pace`;
    }

    if (segment.type === 'maxeffort') {
      return `${type} · ${durationStr}\nAll out effort!`;
    }

    return `${type} · ${durationStr}\n${formatPowerWithWatts(avgPower)}`;
  }, [formatPowerWithWatts]);

  const chartSegments = useMemo<ChartSegment[]>(() => {
    if (totalDuration === 0) return [];

    let currentX = CHART_PADDING.left;
    return segments.map((segment) => {
      const duration = getSegmentDuration(segment);
      const width = (duration / totalDuration) * innerWidth;
      const { points, avgPower } = getSegmentPath(segment, currentX, width, powerToY);
      const color = getColorForPower(avgPower);
      const tooltip = getSegmentTooltip(segment, duration, avgPower);

      const result = {
        id: segment.id,
        x: currentX,
        width,
        points,
        color,
        avgPower,
        tooltip,
      };

      currentX += width;
      return result;
    });
  }, [segments, totalDuration, innerWidth, powerToY, getSegmentTooltip]);

  const xAxisTicks = useMemo(
    () => calculateXAxisTicks(totalDuration),
    [totalDuration]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent, content: string) => {
    if (!canHover || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      content,
      containerWidth: rect.width,
    });
  }, [canHover]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  if (segments.length === 0) {
    return (
      <div
        className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500 dark:text-gray-400">
          Generate or add segments to see your workout
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl"
        preserveAspectRatio="xMidYMid meet"
      >
      <g className="text-gray-300 dark:text-gray-600">
        {Y_AXIS_TICKS.map((tick) => (
          <line
            key={tick}
            x1={CHART_PADDING.left}
            y1={powerToY(tick)}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y2={powerToY(tick)}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray={tick === FTP_LINE_POWER ? '4,4' : undefined}
            opacity={tick === FTP_LINE_POWER ? 0.8 : 0.3}
          />
        ))}
      </g>

      <g className="text-xs fill-gray-500 dark:fill-gray-400">
        {Y_AXIS_TICKS.map((tick) => (
          <text
            key={tick}
            x={CHART_PADDING.left - 8}
            y={powerToY(tick)}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {formatPower(tick)}
          </text>
        ))}
      </g>

      <g className="text-xs fill-gray-500 dark:fill-gray-400">
        {xAxisTicks.map((tick) => (
          <text
            key={tick}
            x={CHART_PADDING.left + (tick / totalDuration) * innerWidth}
            y={height - 10}
            textAnchor="middle"
          >
            {formatDuration(tick)}
          </text>
        ))}
      </g>

      {/* Render all segment fills */}
      {chartSegments.map((segment) => (
        <polygon
          key={segment.id}
          points={segment.points}
          fill={segment.color}
          fillOpacity={selectedSegmentId === segment.id ? 1 : 0.7}
          className="cursor-pointer transition-opacity duration-200 hover:opacity-100"
          onClick={() => onSegmentClick(segment.id)}
          onMouseMove={(e) => handleMouseMove(e, segment.tooltip)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
      {/* Render selection border separately on top */}
      {selectedSegmentId && chartSegments.find((s) => s.id === selectedSegmentId) && (
        <polygon
          points={chartSegments.find((s) => s.id === selectedSegmentId)!.points}
          fill="none"
          stroke={SELECTED_SEGMENT_COLOR}
          strokeWidth={2}
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}

      <line
        x1={CHART_PADDING.left}
        y1={powerToY(0)}
        x2={CHART_WIDTH - CHART_PADDING.right}
        y2={powerToY(0)}
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-400 dark:text-gray-500"
      />
    </svg>

    {/* Tooltip */}
    {tooltip.visible && (() => {
      const showOnLeft = tooltip.x > tooltip.containerWidth - 150;
      return (
        <div
          className="absolute pointer-events-none z-10 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded shadow-lg whitespace-pre-line w-max"
          style={{
            left: showOnLeft ? undefined : tooltip.x + 10,
            right: showOnLeft ? tooltip.containerWidth - tooltip.x + 10 : undefined,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          {tooltip.content}
        </div>
      );
    })()}
  </div>
  );
}
