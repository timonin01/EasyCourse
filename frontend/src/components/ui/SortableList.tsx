import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { easeOut } from './motion';

interface SortableItemProps {
  id: string | number;
  children: ReactNode;
  compact?: boolean;
}

export function SortableItem({ id, children, compact = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto' as const,
  };

  if (compact) {
    return (
      <div ref={setNodeRef} style={style} className="group/sortable flex items-stretch gap-0.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 flex h-7 w-4 shrink-0 cursor-grab items-center justify-center rounded text-dark-600 opacity-0 transition-opacity group-hover/sortable:opacity-100 hover:text-dark-300 active:cursor-grabbing"
          aria-label="Перетащить"
          title="Перетащить"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-dark-500 hover:text-dark-300 transition-opacity"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  );
}

function StaticItem({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-stretch gap-0.5">
        <div className="w-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }
  return <>{children}</>;
}

interface SortableListProps<T extends { id: number }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  animateItems?: boolean;
  /** Inline grip handle, no left padding — for dense trees. */
  compact?: boolean;
  disabled?: boolean;
}

export function SortableList<T extends { id: number }>({
  items,
  onReorder,
  renderItem,
  className = '',
  animateItems = false,
  compact = false,
  disabled = false,
}: SortableListProps<T>) {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  const listClassName = compact
    ? `space-y-1 ${className}`
    : `space-y-2 pl-6 ${className}`;

  const renderWrapped = (item: T, index: number) => {
    const body = animateItems ? (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: index * 0.04, ease: easeOut }}
      >
        {renderItem(item, index)}
      </motion.div>
    ) : (
      renderItem(item, index)
    );

    if (disabled || items.length <= 1) {
      return (
        <StaticItem key={item.id} compact={compact}>
          {body}
        </StaticItem>
      );
    }

    return (
      <SortableItem key={item.id} id={item.id} compact={compact}>
        {body}
      </SortableItem>
    );
  };

  if (disabled || items.length <= 1) {
    return (
      <div className={listClassName}>
        {items.map((item, index) => renderWrapped(item, index))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={listClassName}>
          {items.map((item, index) => renderWrapped(item, index))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
