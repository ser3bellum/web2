"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  DashboardCardDef,
  DashboardCardId,
} from "app/(app)/components/DashboardCards";
import { cn } from "app/(app)/lib/cn";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sb.dashboard.cardOrder.v2";

function loadOrder(): DashboardCardId[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DashboardCardId[]) : null;
  } catch {
    return null;
  }
}

function saveOrder(order: DashboardCardId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

function getSizeClass(size?: DashboardCardDef["size"]) {
  if (size === "large") return "md:col-span-2 xl:col-span-2";
  if (size === "extraLarge") return "md:col-span-2 xl:col-span-2";
  if (size === "small") return "col-span-1";
  return "col-span-1";
}

export function SortableDashboardGrid({
  defs,
  renderCard,
  className,
}: {
  defs: DashboardCardDef[];
  renderCard: (def: DashboardCardDef) => React.ReactNode;
  className?: string;
}) {
  const ids = useMemo(() => defs.map((d) => d.id), [defs]);

  const [order, setOrder] = useState<DashboardCardId[]>(ids);

  useEffect(() => {
    const stored = loadOrder();

    if (!stored) {
      setOrder(ids);
      return;
    }

    const filtered = stored.filter((id) => ids.includes(id));
    const missing = ids.filter((id) => !filtered.includes(id));
    setOrder([...filtered, ...missing]);
  }, [ids]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const defById = useMemo(() => {
    const m = new Map<DashboardCardId, DashboardCardDef>();
    defs.forEach((d) => m.set(d.id, d));
    return m;
  }, [defs]);

  const orderedIds = order.filter((id) => defById.has(id));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    setOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as DashboardCardId);
      const newIndex = prev.indexOf(over.id as DashboardCardId);
      if (oldIndex < 0 || newIndex < 0) return prev;

      const next = arrayMove(prev, oldIndex, newIndex) as DashboardCardId[];
      saveOrder(next);
      return next;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>
          {orderedIds.map((id) => {
            const def = defById.get(id)!;
            return (
              <SortableItem
                key={id}
                id={id}
                className={getSizeClass(def.size)}
              >
                {renderCard(def)}
              </SortableItem>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging && "opacity-70")}
      {...attributes}
    >
      <div className="relative">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          className="absolute right-3 top-3 z-10 cursor-grab active:cursor-grabbing rounded-md border border-black/10 bg-white/70 px-2 py-1 text-zinc-500 hover:bg-white"
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripIcon />
        </button>

        {children}
      </div>
    </div>
  );
}

function GripIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 17h2v2H9v-2zm4 0h2v2h-2v-2z"
        fill="currentColor"
      />
    </svg>
  );
}
