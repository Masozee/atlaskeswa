/**
 * Converts between the stored publication body (`Block[]`, rendered by
 * `BlockView`) and the TipTap document the WYSIWYG editor edits.
 *
 * Inline formatting round-trips through the same sliver of Markdown
 * `InlineText` renders: `**bold**`, `*italic*` and `[label](href)`. Bold and
 * italic do not nest in that syntax, so bold wins when both are applied.
 */
import type { JSONContent } from '@tiptap/react';
import type { Block } from '@/lib/publications';

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;

/* ------------------------------------------------------ markdown -> nodes */

export function inlineToNodes(text: string): JSONContent[] {
  const nodes: JSONContent[] = [];
  for (const part of text.split(TOKEN)) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      nodes.push({ type: 'text', text: part.slice(2, -2), marks: [{ type: 'bold' }] });
      continue;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      nodes.push({ type: 'text', text: part.slice(1, -1), marks: [{ type: 'italic' }] });
      continue;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      nodes.push({ type: 'text', text: link[1], marks: [{ type: 'link', attrs: { href: link[2] } }] });
      continue;
    }
    nodes.push({ type: 'text', text: part });
  }
  return nodes;
}

const textContent = (text: string): JSONContent[] | undefined => (text ? [{ type: 'text', text }] : undefined);

function paragraph(text: string): JSONContent {
  const content = inlineToNodes(text);
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
}

export function blocksToDoc(blocks: Block[]): JSONContent {
  const content: JSONContent[] = blocks.map((block): JSONContent => {
    switch (block.type) {
      case 'p':
        return paragraph(block.text);
      case 'h2':
        return { type: 'heading', attrs: { level: 2 }, content: textContent(block.text) };
      case 'list':
        return {
          type: block.ordered ? 'orderedList' : 'bulletList',
          content: block.items.map((item) => ({ type: 'listItem', content: [paragraph(item)] })),
        };
      case 'quote':
        return { type: 'quoteBlock', attrs: { cite: block.cite }, content: textContent(block.text) };
      case 'note':
        return { type: 'noteBlock', content: textContent(block.text) };
      case 'image':
        return {
          type: 'imageBlock',
          attrs: { src: block.src, alt: block.alt, width: block.width, height: block.height, caption: block.caption ?? '' },
        };
      default:
        return { type: 'structuredBlock', attrs: { block } };
    }
  });
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

/* ------------------------------------------------------ nodes -> markdown */

function markKey(node: JSONContent): string {
  const marks = node.marks ?? [];
  const link = marks.find((mark) => mark.type === 'link');
  if (link) return `link:${link.attrs?.href ?? ''}`;
  if (marks.some((mark) => mark.type === 'bold')) return 'bold';
  if (marks.some((mark) => mark.type === 'italic')) return 'italic';
  return '';
}

/** Inline nodes -> the Markdown sliver, merging adjacent runs with the same mark. */
export function nodesToInline(nodes: JSONContent[] = []): string {
  const runs: { key: string; text: string }[] = [];
  for (const node of nodes) {
    const text = node.type === 'text' ? node.text ?? '' : node.type === 'hardBreak' ? ' ' : '';
    if (!text) continue;
    const key = node.type === 'text' ? markKey(node) : '';
    const last = runs[runs.length - 1];
    if (last && last.key === key) last.text += text;
    else runs.push({ key, text });
  }
  return runs
    .map(({ key, text }) => {
      if (!key || !text.trim()) return text;
      // Keep surrounding spaces outside the markers, or `** bold**` will not parse.
      const [, lead, core, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
      const wrapped = key === 'bold' ? `**${core}**` : key === 'italic' ? `*${core}*` : `[${core}](${key.slice(5)})`;
      return `${lead}${wrapped}${trail}`;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

const plain = (nodes: JSONContent[] = []) =>
  nodes
    .map((node) => (node.type === 'text' ? node.text ?? '' : ' '))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

/** Every paragraph of a list item, nested lists flattened into extra items. */
function listItems(list: JSONContent): string[] {
  const items: string[] = [];
  for (const item of list.content ?? []) {
    const own: string[] = [];
    for (const child of item.content ?? []) {
      if (child.type === 'paragraph') own.push(nodesToInline(child.content));
      else if (child.type === 'bulletList' || child.type === 'orderedList') {
        if (own.length) items.push(own.splice(0).join(' '));
        items.push(...listItems(child));
      }
    }
    if (own.length) items.push(own.join(' '));
  }
  return items.filter(Boolean);
}

export function docToBlocks(doc: JSONContent): Block[] {
  const blocks: Block[] = [];
  for (const node of doc.content ?? []) {
    switch (node.type) {
      case 'paragraph': {
        const text = nodesToInline(node.content);
        if (text) blocks.push({ type: 'p', text });
        break;
      }
      case 'heading': {
        const text = plain(node.content);
        if (text) blocks.push({ type: 'h2', text });
        break;
      }
      case 'bulletList':
      case 'orderedList': {
        const items = listItems(node);
        if (items.length) blocks.push(node.type === 'orderedList' ? { type: 'list', ordered: true, items } : { type: 'list', items });
        break;
      }
      case 'quoteBlock': {
        const text = plain(node.content);
        if (text) blocks.push({ type: 'quote', text, cite: String(node.attrs?.cite ?? '') });
        break;
      }
      case 'noteBlock': {
        const text = plain(node.content);
        if (text) blocks.push({ type: 'note', text });
        break;
      }
      case 'imageBlock': {
        const { src = '', alt = '', width = 1600, height = 900, caption = '' } = node.attrs ?? {};
        if (src) blocks.push(cleanBlock({ type: 'image', src, alt, width: Number(width), height: Number(height), caption }));
        break;
      }
      case 'structuredBlock':
        if (node.attrs?.block) blocks.push(cleanBlock(node.attrs.block as Block));
        break;
    }
  }
  return blocks;
}

/**
 * Drops what an editor leaves behind while typing (blank list lines, empty
 * table rows) so the saved body matches what the page renders.
 */
export function cleanBlock(block: Block): Block {
  const lines = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
  switch (block.type) {
    case 'list':
    case 'steps':
    case 'callout':
      return { ...block, items: lines(block.items) };
    case 'timeline':
      return { ...block, items: block.items.filter((item) => item.title.trim() || item.period.trim()) };
    case 'table': {
      const rows = block.rows.filter((row) => row.label.trim() || row.value.trim());
      const hasHead = !!block.head && !!(block.head[0].trim() || block.head[1].trim());
      return hasHead
        ? { type: 'table', caption: block.caption, head: block.head, rows }
        : { type: 'table', caption: block.caption, rows };
    }
    case 'image':
      return block.caption ? block : { type: 'image', src: block.src, alt: block.alt, width: block.width, height: block.height };
    default:
      return block;
  }
}
