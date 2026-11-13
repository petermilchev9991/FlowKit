import { cn } from '@/lib/utils';

export function SectionHeading({ title, text, center = false }: { title: string; text?: string; center?: boolean }) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <h2 className="text-3xl font-bold tracking-[-0.02em] text-balance sm:text-[2.1rem]">{title}</h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{text}</p>}
    </div>
  );
}
