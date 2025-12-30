import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutChart } from './WorkoutChart';
import type { WorkoutSegment } from '../../types/workout';
import { useSettingsStore } from '../../store/settingsStore';

describe('WorkoutChart', () => {
  const mockOnSegmentClick = vi.fn();

  const sampleSegments: WorkoutSegment[] = [
    { id: '1', type: 'warmup', duration: 600, powerLow: 0.4, powerHigh: 0.7 },
    { id: '2', type: 'steadystate', duration: 300, power: 0.75 },
    { id: '3', type: 'cooldown', duration: 300, powerLow: 0.4, powerHigh: 0.6 },
  ];

  beforeEach(() => {
    mockOnSegmentClick.mockClear();
  });

  describe('empty state', () => {
    it('renders empty message when no segments', () => {
      render(
        <WorkoutChart
          segments={[]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      expect(screen.getByText(/generate or add segments/i)).toBeInTheDocument();
    });

    it('does not render SVG when no segments', () => {
      const { container } = render(
        <WorkoutChart
          segments={[]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('with segments', () => {
    it('renders SVG chart', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders polygon for each segment', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygons = container.querySelectorAll('polygon');
      expect(polygons.length).toBe(sampleSegments.length);
    });

    it('calls onSegmentClick when segment is clicked', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygons = container.querySelectorAll('polygon');
      fireEvent.click(polygons[0]);

      expect(mockOnSegmentClick).toHaveBeenCalledWith('1');
    });

    it('renders Y-axis labels', () => {
      render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('renders X-axis time labels', () => {
      render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      expect(screen.getByText('0:00')).toBeInTheDocument();
    });
  });

  describe('segment selection', () => {
    it('renders selection border for selected segment', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId="2"
          onSegmentClick={mockOnSegmentClick}
        />
      );

      // Should have a polygon with the selection stroke color
      const selectionBorder = container.querySelectorAll('polygon[stroke="#1d4ed8"]');
      expect(selectionBorder.length).toBe(1);
    });

    it('does not render selection border when no segment selected', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const selectionBorder = container.querySelectorAll('polygon[stroke="#1d4ed8"]');
      expect(selectionBorder.length).toBe(0);
    });
  });

  describe('custom height', () => {
    it('applies custom height', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
          height={300}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toContain('300');
    });

    it('uses default height when not specified', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toContain('200');
    });
  });

  describe('different segment types', () => {
    it('renders warmup segment correctly', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{ id: '1', type: 'warmup', duration: 600, powerLow: 0.4, powerHigh: 0.7 }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
      expect(polygon?.getAttribute('points')).toBeTruthy();
    });

    it('renders intervals segment correctly', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{
            id: '1',
            type: 'intervals',
            repeat: 4,
            onDuration: 60,
            offDuration: 60,
            onPower: 1.0,
            offPower: 0.5,
          }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
      // Intervals should have more complex path with many points
      const points = polygon?.getAttribute('points')?.split(' ') || [];
      expect(points.length).toBeGreaterThan(4);
    });

    it('renders freeride segment correctly', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{ id: '1', type: 'freeride', duration: 600 }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });

    it('renders maxeffort segment correctly', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{ id: '1', type: 'maxeffort', duration: 30 }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });
  });

  describe('tooltips', () => {
    beforeEach(() => {
      useSettingsStore.setState({ ftp: 200 });
      // Mock matchMedia to simulate hover-capable device
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(hover: hover)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('shows tooltip on mouse move over segment', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      fireEvent.mouseMove(polygon!, { clientX: 100, clientY: 100 });

      expect(screen.getByText(/Warm Up/)).toBeInTheDocument();
    });

    it('hides tooltip on mouse leave', () => {
      const { container } = render(
        <WorkoutChart
          segments={sampleSegments}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      fireEvent.mouseMove(polygon!, { clientX: 100, clientY: 100 });
      expect(screen.getByText(/Warm Up/)).toBeInTheDocument();

      fireEvent.mouseLeave(polygon!);
      expect(screen.queryByText(/Warm Up/)).not.toBeInTheDocument();
    });

    it('shows tooltip with watts for steady state segment', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{ id: '1', type: 'steadystate', duration: 300, power: 0.75 }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      fireEvent.mouseMove(polygon!, { clientX: 100, clientY: 100 });

      expect(screen.getByText(/Steady State/)).toBeInTheDocument();
      expect(screen.getByText(/75%.*150W/)).toBeInTheDocument();
    });

    it('shows tooltip with interval details', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{
            id: '1',
            type: 'intervals',
            repeat: 5,
            onDuration: 60,
            offDuration: 60,
            onPower: 1.2,
            offPower: 0.5,
          }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      fireEvent.mouseMove(polygon!, { clientX: 100, clientY: 100 });

      expect(screen.getByText(/Intervals/)).toBeInTheDocument();
      expect(screen.getByText(/5 reps/)).toBeInTheDocument();
    });

    it('shows tooltip with ramp power range', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{ id: '1', type: 'ramp', duration: 300, powerLow: 0.5, powerHigh: 1.0 }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      fireEvent.mouseMove(polygon!, { clientX: 100, clientY: 100 });

      expect(screen.getByText(/Ramp/)).toBeInTheDocument();
      expect(screen.getByText(/50%.*→.*100%/)).toBeInTheDocument();
    });

    it('shows freeride tooltip', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{ id: '1', type: 'freeride', duration: 600 }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      fireEvent.mouseMove(polygon!, { clientX: 100, clientY: 100 });

      expect(screen.getByText(/Free Ride/)).toBeInTheDocument();
      expect(screen.getByText(/Ride at your own pace/)).toBeInTheDocument();
    });

    it('shows max effort tooltip', () => {
      const { container } = render(
        <WorkoutChart
          segments={[{ id: '1', type: 'maxeffort', duration: 30 }]}
          selectedSegmentId={null}
          onSegmentClick={mockOnSegmentClick}
        />
      );

      const polygon = container.querySelector('polygon');
      fireEvent.mouseMove(polygon!, { clientX: 100, clientY: 100 });

      expect(screen.getByText(/Max Effort/)).toBeInTheDocument();
      expect(screen.getByText(/All out effort!/)).toBeInTheDocument();
    });
  });
});
