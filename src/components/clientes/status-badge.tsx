import { Badge } from "@/components/ui/badge";
import {
  CLIENT_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type ClientStatus,
  type ProjectStatus,
} from "@/lib/types";

type Variant = "default" | "secondary" | "destructive" | "outline";

const clientVariants: Record<ClientStatus, Variant> = {
  lead: "outline",
  activo: "default",
  pausado: "secondary",
  cerrado: "secondary",
};

const projectVariants: Record<ProjectStatus, Variant> = {
  discovery: "outline",
  propuesta: "outline",
  en_curso: "default",
  entregado: "secondary",
  cancelado: "destructive",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge variant={clientVariants[status]}>{CLIENT_STATUS_LABELS[status]}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant={projectVariants[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>
  );
}

/** Fecha corta en espanol, p. ej. "19 nov 2026". */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Fecha y hora, para los comentarios. */
export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
