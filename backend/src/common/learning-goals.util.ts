export function parseLearningGoals(raw: string | null | undefined): {
  text: string;
  tags: string[];
} {
  if (!raw) return { text: '', tags: [] };
  const match = raw.match(/\[tags:([^\]]+)\]/);
  if (!match) return { text: raw.trim(), tags: [] };
  const tags = match[1]
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const text = raw.replace(/\n?\[tags:[^\]]+\]/, '').trim();
  return { text, tags };
}
