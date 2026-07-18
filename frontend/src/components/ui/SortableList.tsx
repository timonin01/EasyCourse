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
  /** Custom sortable id (needed when multiple lists share one DndContext). */
  getSortableId?: (item: T) => string | number;
  /**
   * Participate in an outer DndContext — do not create a nested one.
   * Parent must handle drag-end and call onReorder / move callbacks.
   */
  shared?: boolean;
  /** Keep items draggable even when the list has a single item (cross-list moves). */
  forceDraggable?: boolean;
}

export function SortableList<T extends { id: number }>({
  items,
  onReorder,
  renderItem,
  className = '',
  animateItems = false,
  compact = false,
  disabled = false,
  getSortableId = (item) => item.id,
  shared = false,
  forceDraggable = false,
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

  const sortableIds = items.map(getSortableId);
  const canDrag = !disabled && (forceDraggable || items.length > 1);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => getSortableId(item) === active.id);
      const newIndex = items.findIndex((item) => getSortableId(item) === over.id);
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

    const sortableId = getSortableId(item);

    if (!canDrag) {
      return (
        <StaticItem key={item.id} compact={compact}>
          {body}
        </StaticItem>
      );
    }

    return (
      <SortableItem key={item.id} id={sortableId} compact={compact}>
        {body}
      </SortableItem>
    );
  };

  const listBody = (
    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
      <div className={listClassName}>
        {items.map((item, index) => renderWrapped(item, index))}
      </div>
    </SortableContext>
  );

  if (shared) {
    return listBody;
  }

  if (!canDrag) {
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
      {listBody}
    </DndContext>
  );
}
