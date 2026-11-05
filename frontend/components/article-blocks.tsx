import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Block } from '@/lib/publications';
import { InlineText } from '@/components/inline-text';
import { DesdeAdaptationDiagram, OmmhaClassificationDiagram } from '@/components/ommha-diagrams';

/**
 * Typesets the content blocks shared by publications and the long-form
 * articles (Klasifikasi OMMHA, Tentang OMMHA). Prose strings accept the small
 * inline markup of `InlineText`.
 */

export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function Caption({ children }: { children: React.ReactNode }) {
  return <figcaption className="mt-3 text-[13px] text-muted-foreground leading-snug">{children}</figcaption>;
}

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return (
        <p>
          <InlineText text={block.text} />
        </p>
      );

    case 'diagram':
      return (
        <figure className="py-2">
          {block.diagram === 'desde-adaptation' ? <DesdeAdaptationDiagram /> : <OmmhaClassificationDiagram />}
          <Caption>{block.caption}</Caption>
        </figure>
      );

    case 'h2':
      return (
        <h2 id={headingId(block.text)} className="scroll-mt-6 pt-6 text-xl font-semibold tracking-tight text-foreground">
          {block.text}
        </h2>
      );

    case 'quote':
      return (
        <figure className="border-l-2 border-[#00979D] pl-5">
          <blockquote className="text-lg leading-relaxed text-foreground">“{block.text}”</blockquote>
          <figcaption className="mt-2 text-sm text-muted-foreground">— {block.cite}</figcaption>
        </figure>
      );

    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List className={cn('space-y-2 pl-5', block.ordered ? 'list-decimal' : 'list-disc', 'marker:text-muted-foreground')}>
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              <InlineText text={item} />
            </li>
          ))}
        </List>
      );
    }

    case 'image': {
      // A portrait diagram at full column width would run three screens tall.
      const portrait = block.height > block.width;
      return (
        <figure className={cn('py-2', portrait && 'max-w-md')}>
          <Image
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            sizes={portrait ? '448px' : '(min-width: 1024px) 680px, 100vw'}
            className="w-full h-auto rounded-lg border"
          />
          {block.caption && <Caption>{block.caption}</Caption>}
        </figure>
      );
    }

    case 'table':
      return (
        <figure className="py-2">
          <Caption>{block.caption}</Caption>
          <table className="mt-3 w-full border-collapse text-[15px]">
            {block.head && (
              <thead>
                <tr className="border-b border-foreground/40">
                  <th className="py-2 pr-4 text-left font-medium">{block.head[0]}</th>
                  <th className="py-2 text-right font-medium">{block.head[1]}</th>
                </tr>
              </thead>
            )}
            <tbody className={cn(!block.head && 'border-t border-foreground/40')}>
              {block.rows.map((row) => (
                <tr key={row.label} className="border-b">
                  <th
                    scope="row"
                    className={cn(
                      'py-2 pr-4 text-left',
                      row.strong ? 'font-medium text-foreground' : 'font-normal',
                      row.indent && 'pl-5 text-muted-foreground'
                    )}
                  >
                    {row.label}
                  </th>
                  <td className={cn('py-2 text-right tabular-nums', row.strong && 'font-medium text-foreground')}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );

    case 'steps':
      return (
        <figure className="py-2">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item, index) => (
              <li key={item} className="flex gap-3 rounded-lg border bg-muted/30 p-4">
                <span
                  aria-hidden
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#07579E] text-xs font-medium text-white tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="text-[15px] leading-snug text-foreground">{item}</span>
              </li>
            ))}
          </ol>
          <Caption>{block.caption}</Caption>
        </figure>
      );

    case 'timeline':
      return (
        <figure className="py-2">
          <ol className="relative space-y-5 border-l border-border pl-6">
            {block.items.map((item) => (
              <li key={item.title} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.84rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-[#07579E]"
                />
                <p className="text-[15px] font-medium leading-snug text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.period}</p>
              </li>
            ))}
          </ol>
          <Caption>{block.caption}</Caption>
        </figure>
      );

    case 'callout':
      return (
        <aside className="rounded-lg bg-[#07579E] p-5 text-white">
          <p className="text-[15px] font-medium">{block.title}</p>
          <ul className="mt-3 space-y-1.5 list-disc pl-5 text-[15px] text-white/90 marker:text-white/60">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      );

    case 'note':
      return (
        <p className="border-l-2 border-border pl-4 text-sm text-muted-foreground leading-relaxed">{block.text}</p>
      );
  }
}
