export type TreeNodeType = 'section' | 'lesson' | 'step';

export type TreeDragId =
  | `section:${number}`
  | `lesson:${number}`
  | `step:${number}`
  | `lesson-drop:${number}`
  | `section-drop:${number}`;

export function treeId(type: TreeNodeType | 'lesson-drop' | 'section-drop', id: number): TreeDragId {
  return `${type}:${id}` as TreeDragId;
}

export function parseTreeId(raw: string | number): { type: TreeNodeType | 'lesson-drop' | 'section-drop'; id: number } | null {
  const value = String(raw);
  const match = /^(section|lesson|step|lesson-drop|section-drop):(\d+)$/.exec(value);
  if (!match) return null;
  return {
    type: match[1] as TreeNodeType | 'lesson-drop' | 'section-drop',
    id: Number(match[2]),
  };
}
