"use client";

import { Building2, FolderKanban, Mail, Phone, Tag, Trash2 } from "lucide-react";

import { NewProjectDialog, type NewProjectInput } from "@/components/clientes/new-project-dialog";
import { ProjectCard } from "@/components/clientes/project-card";
import { formatDate } from "@/components/clientes/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_ORDER,
  type Client,
  type ClientStatus,
  type ProjectStatus,
} from "@/lib/types";

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm">{value}</p>
      </div>
    </div>
  );
}

export function ClientDetail({
  client,
  onStatusChange,
  onDelete,
  onAddProject,
  onProjectStatusChange,
  onDeleteProject,
  onAddComment,
}: {
  client: Client;
  onStatusChange: (status: ClientStatus) => void;
  onDelete: () => void;
  onAddProject: (input: NewProjectInput) => void;
  onProjectStatusChange: (projectId: string, status: ProjectStatus) => void;
  onDeleteProject: (projectId: string) => void;
  onAddComment: (projectId: string, body: string) => void;
}) {
  const hasContactData = Boolean(
    client.company || client.email || client.phone || client.industry,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {client.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.company || "Sin empresa"} · alta el {formatDate(client.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={client.status}
            onValueChange={(value) => onStatusChange(value as ClientStatus)}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {CLIENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            aria-label={`Eliminar el cliente ${client.name}`}
          >
            <Trash2 />
            Eliminar
          </Button>
        </div>
      </div>

      {(hasContactData || client.notes) && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            {hasContactData && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={Building2} label="Empresa" value={client.company} />
                <Field icon={Tag} label="Sector" value={client.industry} />
                <Field icon={Mail} label="Correo" value={client.email} />
                <Field icon={Phone} label="Teléfono" value={client.phone} />
              </div>
            )}
            {hasContactData && client.notes && <Separator />}
            {client.notes && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Notas</p>
                <p className="text-sm whitespace-pre-wrap text-pretty">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-semibold">
          Proyectos
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
            {client.projects.length}
          </span>
        </h3>
        <NewProjectDialog clientName={client.name} onCreate={onAddProject} />
      </div>

      {client.projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-md bg-muted">
              <FolderKanban className="size-5 text-muted-foreground" />
            </span>
            <div>
              <p className="text-sm font-medium">Todavía no hay proyectos</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Abre el primero para empezar a registrar su avance.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {client.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onStatusChange={(status) => onProjectStatusChange(project.id, status)}
              onDelete={() => onDeleteProject(project.id)}
              onAddComment={(body) => onAddComment(project.id, body)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
