import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { WorkoutSegment } from '../../types/workout';
import { SegmentCard, SegmentCardOverlay } from './SegmentCard';

interface SegmentListProps {
  segments: WorkoutSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (id: string) => void;
  onDeleteSegment: (id: string) => void;
  onDuplicateSegment: (id: string) => void;
  onMoveSegment: (fromIndex: number, toIndex: number) => void;
}

export function SegmentList({
  segments,
  selectedSegmentId,
  onSelectSegment,
  onDeleteSegment,
  onDuplicateSegment,
  onMoveSegment,
}: SegmentListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = segments.findIndex((seg) => seg.id === active.id);
      const newIndex = segments.findIndex((seg) => seg.id === over.id);
      onMoveSegment(oldIndex, newIndex);
    }

    setActiveId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  if (segments.length === 0) {
    return null;
  }

  const activeSegment = activeId ? segments.find((s) => s.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={segments.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {segments.map((segment) => (
            <SegmentCard
              key={segment.id}
              segment={segment}
              isSelected={segment.id === selectedSegmentId}
              onSelect={() => onSelectSegment(segment.id)}
              onDelete={() => onDeleteSegment(segment.id)}
              onDuplicate={() => onDuplicateSegment(segment.id)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
        {activeSegment ? <SegmentCardOverlay segment={activeSegment} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
