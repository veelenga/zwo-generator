import { useMemo, useCallback } from 'react';
import type { WorkoutSegment, IntervalsSegment } from '../../types/workout';
import { getSegmentDuration } from '../../utils/workoutUtils';
import { getColorForPower } from '../../utils/powerZones';
import { formatDuration, formatPower } from '../../utils/formatters';

interface WorkoutChartProps {
  segments: WorkoutSegment[];
  selectedSegmentId: string | null;
  onSegmentClick: (id: string) => void;
  height?: number;
}

const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const CHART_WIDTH = 800;
const MAX_POWER_DISPLAY = 1.5;
const MIN_POWER_DISPLAY = 0;
const Y_AXIS_TICKS = [0, 0.5, 0.75, 1.0, 1.25, 1.5];
const TICK_INTERVAL_SECONDS = 300;
const MAX_X_AXIS_TICKS = 6;
const SELECTED_SEGMENT_COLOR = '#1d4ed8';
const FTP_LINE_POWER = 1;

interface ChartSegment {
  id: string;
  x: number;
  width: number;
  points: string;
  color: string;
  avgPower: number;
}

function getSegmentPath(
  segment: WorkoutSegment,
  x: number,
  width: number,
  powerToY: (power: number) => number
): { points: string; avgPower: number } {
  const baseline = powerToY(0);

  switch (segment.type) {
    case 'warmup':
    case 'ramp': {
      const startY = powerToY(segment.powerLow);
      const endY = powerToY(segment.powerHigh);
      return {
        points: `${x},${baseline} ${x},${startY} ${x + width},${endY} ${x + width},${baseline}`,
        avgPower: (segment.powerLow + segment.powerHigh) / 2,
      };
    }
    case 'cooldown': {
      const startY = powerToY(segment.powerHigh);
      const endY = powerToY(segment.powerLow);
      return {
        points: `${x},${baseline} ${x},${startY} ${x + width},${endY} ${x + width},${baseline}`,
        avgPower: (segment.powerLow + segment.powerHigh) / 2,
      };
    }
    case 'steadystate': {
      const y = powerToY(segment.power);
      return {
        points: `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`,
        avgPower: segment.power,
      };
    }
    case 'intervals': {
      const intervals = segment as IntervalsSegment;
      const singleIntervalWidth = width / intervals.repeat;
      const onRatio = intervals.onDuration / (intervals.onDuration + intervals.offDuration);
      const onWidth = singleIntervalWidth * onRatio;

      let points = `${x},${baseline}`;
      let currentX = x;

      for (let i = 0; i < intervals.repeat; i++) {
        const onY = powerToY(intervals.onPower);
        const offY = powerToY(intervals.offPower);

        points += ` ${currentX},${onY} ${currentX + onWidth},${onY}`;
        points += ` ${currentX + onWidth},${offY} ${currentX + singleIntervalWidth},${offY}`;
        currentX += singleIntervalWidth;
      }

      points += ` ${x + width},${baseline}`;

      const avgPower =
        (intervals.onPower * intervals.onDuration + intervals.offPower * intervals.offDuration) /
        (intervals.onDuration + intervals.offDuration);

      return { points, avgPower };
    }
    case 'freeride': {
      const y = powerToY(0.5);
      return {
        points: `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`,
        avgPower: 0.5,
      };
    }
    case 'maxeffort': {
      const y = powerToY(1.5);
      return {
        points: `${x},${baseline} ${x},${y} ${x + width},${y} ${x + width},${baseline}`,
        avgPower: 1.5,
      };
    }
    default:
      return { points: '', avgPower: 0 };
  }
}

export function WorkoutChart({
  segments,
  selectedSegmentId,
  onSegmentClick,
  height = 200,
}: WorkoutChartProps) {
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const totalDuration = useMemo(
    () => segments.reduce((sum, seg) => sum + getSegmentDuration(seg), 0),
    [segments]
  );

  const powerToY = useCallback((power: number) => {
    const normalized = (power - MIN_POWER_DISPLAY) / (MAX_POWER_DISPLAY - MIN_POWER_DISPLAY);
    return CHART_PADDING.top + innerHeight * (1 - normalized);
  }, [innerHeight]);

  const chartSegments = useMemo<ChartSegment[]>(() => {
    if (totalDuration === 0) return [];

    let currentX = CHART_PADDING.left;
    return segments.map((segment) => {
      const duration = getSegmentDuration(segment);
      const width = (duration / totalDuration) * innerWidth;
      const { points, avgPower } = getSegmentPath(segment, currentX, width, powerToY);
      const color = getColorForPower(avgPower);

      const result = {
        id: segment.id,
        x: currentX,
        width,
        points,
        color,
        avgPower,
      };

      currentX += width;
      return result;
    });
  }, [segments, totalDuration, innerWidth, powerToY]);

  const xAxisTicks = useMemo(() => {
    if (totalDuration === 0) return [];
    const tickCount = Math.min(MAX_X_AXIS_TICKS, Math.floor(totalDuration / TICK_INTERVAL_SECONDS));
    const interval = totalDuration / tickCount;
    return Array.from({ length: tickCount + 1 }, (_, i) => i * interval);
  }, [totalDuration]);

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
  );
}
