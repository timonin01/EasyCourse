export type EditorDragType = 'section' | 'lesson' | 'step';

export function editorDragId(type: EditorDragType, id: number): string {
  return `${type}:${id}`;
}

export function parseEditorDragId(
  raw: string | number,
): { type: EditorDragType; id: number } | null {
  const match = /^(section|lesson|step):(\d+)$/.exec(String(raw));
  if (!match) return null;
  return { type: match[1] as EditorDragType, id: Number(match[2]) };
}
