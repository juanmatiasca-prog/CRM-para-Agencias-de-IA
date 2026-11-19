import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Barra superior de cada pestana: trigger del menu, titulo y acciones. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-6" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-base font-semibold">{title}</h1>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </header>
  );
}
