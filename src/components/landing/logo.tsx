import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-heading", className)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        MH
      </span>
      <span className="font-semibold tracking-tight">
        CRM<span className="text-muted-foreground">_</span>MKt
        <span className="text-muted-foreground">_</span>HACKERS
      </span>
    </span>
  );
}
