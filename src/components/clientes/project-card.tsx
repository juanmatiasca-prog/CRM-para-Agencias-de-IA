"use client";

import { useState } from "react";
import { MessageSquare, SendHorizontal, Trash2 } from "lucide-react";

import { ProjectStatusBadge, formatDate, formatDateTime } from "@/components/clientes/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_ORDER,
  type Project,
  type ProjectStatus,
} from "@/lib/types";

function authorInitials(author: string): string {
  const base = author.split("@")[0];
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function ProjectCard({
  project,
  onStatusChange,
  onDelete,
  onAddComment,
}: {
  project: Project;
  onStatusChange: (status: ProjectStatus) => void;
  onDelete: () => void;
  onAddComment: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onAddComment(body);
    setDraft("");
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-sm font-semibold">{project.name}</h3>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Creado el {formatDate(project.createdAt)}
              {project.budget !== null && ` · ${euro.format(project.budget)}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={project.status}
              onValueChange={(value) => onStatusChange(value as ProjectStatus)}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar el proyecto ${project.name}`}
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground text-pretty">
            {project.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Separator />

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MessageSquare className="size-3.5" />
          {project.comments.length === 0
            ? "Sin comentarios"
            : `${project.comments.length} comentario${project.comments.length === 1 ? "" : "s"}`}
        </div>

        {project.comments.length > 0 && (
          <ul className="flex flex-col gap-3">
            {project.comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {authorInitials(comment.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-xs font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-pretty">
                    {comment.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submitComment} className="flex flex-col gap-2">
          <Textarea
            rows={2}
            placeholder="Escribe un comentario sobre el avance…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Ctrl/Cmd + Enter envia, como en la mayoria de herramientas.
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Ctrl + Enter para enviar
            </span>
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              <SendHorizontal />
              Comentar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
