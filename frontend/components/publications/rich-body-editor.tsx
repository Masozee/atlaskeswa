'use client';

import { useState } from 'react';
import {
  EditorContent,
  mergeAttributes,
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  useEditorState,
  type Editor,
  type ReactNodeViewProps,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssetInput } from '@/components/publications/asset-input';
import { BLOCK_LABELS, BlockFields, emptyBlock } from '@/components/publications/block-fields';
import { blocksToDoc, docToBlocks } from '@/components/publications/body-conversion';
import type { Block, BlockType } from '@/lib/publications';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  Delete02Icon,
  Heading02Icon,
  Image01Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  NoteIcon,
  ParagraphIcon,
  QuoteDownIcon,
  TextBoldIcon,
  TextItalicIcon,
} from '@hugeicons/core-free-icons';

/* ------------------------------------------------------------ node views */

/** Card chrome for nodes edited through a form rather than inline. */
function NodeCard({
  label,
  selected,
  onDelete,
  children,
}: {
  label: string;
  selected: boolean;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  return (
    <NodeViewWrapper
      className={cn('not-prose my-5 rounded-lg border bg-muted/30', selected && 'ring-2 ring-[#00979D]/60')}
      contentEditable={false}
    >
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          aria-label={`Hapus ${label.toLowerCase()}`}
          onClick={onDelete}
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
        </Button>
      </div>
      <div className="p-3 text-sm leading-normal">{children}</div>
    </NodeViewWrapper>
  );
}

function ImageView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const { src, alt, caption, width, height } = node.attrs as {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
  };
  return (
    <NodeCard label="Gambar" selected={selected} onDelete={deleteNode}>
      <div className="space-y-3">
        <AssetInput
          kind="image"
          value={src}
          onChange={(next, meta) => {
            const w = meta?.width ?? width;
            const h = meta?.height ?? height;
            if (next === src && w === width && h === height) return;
            updateAttributes({ src: next, width: w, height: h });
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Teks alternatif (untuk pembaca layar)" value={alt} onChange={(e) => updateAttributes({ alt: e.target.value })} />
          <Input placeholder="Keterangan (opsional)" value={caption} onChange={(e) => updateAttributes({ caption: e.target.value })} />
        </div>
      </div>
    </NodeCard>
  );
}

function StructuredView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const block = node.attrs.block as Block;
  return (
    <NodeCard label={BLOCK_LABELS[block.type]} selected={selected} onDelete={deleteNode}>
      <BlockFields block={block} onChange={(next) => updateAttributes({ block: next })} />
    </NodeCard>
  );
}

function QuoteView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper as="figure" className="my-5 border-l-2 border-[#00979D] pl-5">
      <NodeViewContent<'blockquote'> as="blockquote" className="text-lg leading-relaxed text-foreground" />
      <div contentEditable={false} className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        —
        <input
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
          placeholder="Sumber kutipan (nama, jabatan)"
          value={node.attrs.cite as string}
          onChange={(e) => updateAttributes({ cite: e.target.value })}
        />
      </div>
    </NodeViewWrapper>
  );
}

/* ----------------------------------------------------------------- nodes */

const QuoteBlock = Node.create({
  name: 'quoteBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  defining: true,
  addAttributes() {
    return { cite: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'blockquote' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(HTMLAttributes), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(QuoteView);
  },
});

const NoteBlock = Node.create({
  name: 'noteBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  defining: true,
  parseHTML() {
    return [{ tag: 'p[data-note]', priority: 60 }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-note': '',
        class: 'border-l-2 border-border pl-4 text-sm text-muted-foreground leading-relaxed',
      }),
      0,
    ];
  },
});

const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
      width: { default: 1600 },
      height: { default: 900 },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (el) => ({
          src: (el as HTMLImageElement).getAttribute('src') ?? '',
          alt: (el as HTMLImageElement).getAttribute('alt') ?? '',
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

const StructuredBlock = Node.create({
  name: 'structuredBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      block: {
        default: null,
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute('data-block') ?? 'null');
          } catch {
            return null;
          }
        },
        renderHTML: (attrs) => ({ 'data-block': JSON.stringify(attrs.block) }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-block]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StructuredView);
  },
});

/* --------------------------------------------------------------- toolbar */

const STRUCTURED: BlockType[] = ['table', 'steps', 'timeline', 'callout', 'diagram'];

function ToolButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof TextBoldIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Toggle
      size="sm"
      pressed={!!active}
      disabled={disabled}
      aria-label={label}
      title={label}
      // Keep the selection in the editor while clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onPressedChange={onClick}
    >
      <HugeiconsIcon icon={icon} size={16} />
    </Toggle>
  );
}

function LinkButton({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState('');

  const apply = () => {
    const url = href.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (url) chain.setLink({ href: url }).run();
    else chain.unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setHref((editor.getAttributes('link').href as string) ?? '');
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Toggle size="sm" pressed={active} aria-label="Tautan" title="Tautan" onMouseDown={(e) => e.preventDefault()}>
          <HugeiconsIcon icon={Link01Icon} size={16} />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2">
        <p className="text-xs text-muted-foreground">Pilih teks dulu, lalu isi alamat tautan. Kosongkan untuk menghapus.</p>
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="https://"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply();
              }
            }}
          />
          <Button type="button" size="sm" className="h-9" onClick={apply}>
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      link: e.isActive('link'),
      h2: e.isActive('heading', { level: 2 }),
      paragraph: e.isActive('paragraph'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('quoteBlock'),
      note: e.isActive('noteBlock'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      // Marks only exist on paragraphs and list items.
      canMark: e.can().toggleBold(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b bg-background/95 px-2 py-1.5 backdrop-blur">
      <ToolButton label="Paragraf" icon={ParagraphIcon} active={state.paragraph} onClick={() => chain().setParagraph().run()} />
      <ToolButton label="Subjudul" icon={Heading02Icon} active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <Separator orientation="vertical" className="mx-1 !h-5" />
      <ToolButton label="Tebal" icon={TextBoldIcon} active={state.bold} disabled={!state.canMark} onClick={() => chain().toggleBold().run()} />
      <ToolButton label="Miring" icon={TextItalicIcon} active={state.italic} disabled={!state.canMark} onClick={() => chain().toggleItalic().run()} />
      <LinkButton editor={editor} active={state.link} />
      <Separator orientation="vertical" className="mx-1 !h-5" />
      <ToolButton label="Daftar berbutir" icon={LeftToRightListBulletIcon} active={state.bullet} onClick={() => chain().toggleBulletList().run()} />
      <ToolButton label="Daftar bernomor" icon={LeftToRightListNumberIcon} active={state.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <ToolButton
        label="Kutipan"
        icon={QuoteDownIcon}
        active={state.quote}
        onClick={() => (state.quote ? chain().setParagraph().run() : chain().setNode('quoteBlock').run())}
      />
      <ToolButton
        label="Catatan"
        icon={NoteIcon}
        active={state.note}
        onClick={() => (state.note ? chain().setParagraph().run() : chain().setNode('noteBlock').run())}
      />
      <ToolButton label="Gambar" icon={Image01Icon} onClick={() => chain().insertContent({ type: 'imageBlock' }).run()} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onMouseDown={(e) => e.preventDefault()}>
            <HugeiconsIcon icon={Add01Icon} size={14} />
            Sisipkan
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {STRUCTURED.map((type) => (
            <DropdownMenuItem
              key={type}
              onClick={() => chain().insertContent({ type: 'structuredBlock', attrs: { block: emptyBlock(type) } }).run()}
            >
              {BLOCK_LABELS[type]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="ml-auto flex">
        <ToolButton label="Urungkan" icon={ArrowTurnBackwardIcon} disabled={!state.canUndo} onClick={() => chain().undo().run()} />
        <ToolButton label="Ulangi" icon={ArrowTurnForwardIcon} disabled={!state.canRedo} onClick={() => chain().redo().run()} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- editor */

/**
 * WYSIWYG editor for a publication body. Uncontrolled: seeded once from
 * `initialBlocks`, then reports every change as `Block[]`.
 */
export function RichBodyEditor({
  initialBlocks,
  onChange,
}: {
  initialBlocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder: 'Mulai menulis isi publikasi… Pilih Subjudul, Gambar, atau Sisipkan untuk blok lain.' }),
      QuoteBlock,
      NoteBlock,
      ImageBlock,
      StructuredBlock,
    ],
    content: blocksToDoc(initialBlocks),
    editorProps: {
      attributes: {
        class: 'publication-prose min-h-[420px] px-5 py-4 outline-none',
        'aria-label': 'Isi halaman',
      },
    },
    onUpdate: ({ editor: e }) => onChange(docToBlocks(e.getJSON())),
  });

  if (!editor) {
    return <div className="min-h-[470px] rounded-lg border bg-muted/30 animate-pulse" />;
  }

  return (
    <div className="rounded-lg border focus-within:border-[#00979D]/60 transition-colors">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
