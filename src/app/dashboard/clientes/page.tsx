"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";

import { ClientDetail } from "@/components/clientes/client-detail";
import { NewClientDialog } from "@/components/clientes/new-client-dialog";
import { ClientStatusBadge } from "@/components/clientes/status-badge";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/use-clients";
import { cn } from "@/lib/utils";

export default function ClientesPage() {
  const {
    clients,
    ready,
    addClient,
    updateClientStatus,
    removeClient,
    addProject,
    updateProjectStatus,
    removeProject,
    addComment,
  } = useClients();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) =>
      [client.name, client.company, client.email, client.industry]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [clients, query]);

  // Si el seleccionado desaparece (borrado o filtrado), cae al primero visible.
  const selected =
    clients.find((client) => client.id === selectedId) ?? filtered[0] ?? null;

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Clientes, sus proyectos y el seguimiento de cada uno"
        actions={
          <NewClientDialog
            onCreate={(input) => {
              const client = addClient(input);
              setSelectedId(client.id);
              toast.success(`${client.name} añadido`);
            }}
          />
        }
      />

      <div className="grid flex-1 gap-0 lg:grid-cols-[320px_1fr]">
        {/* Lista */}
        <div className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente…"
                className="pl-8"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 lg:h-[calc(100svh-8.5rem)]">
            {!ready ? (
              <div className="flex flex-col gap-2 p-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {clients.length === 0
                  ? "Aún no hay clientes."
                  : "Ningún cliente coincide con la búsqueda."}
              </p>
            ) : (
              <ul className="flex flex-col p-2">
                {filtered.map((client) => {
                  const isActive = selected?.id === client.id;
                  return (
                    <li key={client.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(client.id)}
                        aria-current={isActive}
                        className={cn(
                          "w-full rounded-md px-3 py-2.5 text-left transition-colors",
                          isActive ? "bg-muted" : "hover:bg-muted/60",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {client.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {client.company || "Sin empresa"}
                            </span>
                          </span>
                          <ClientStatusBadge status={client.status} />
                        </div>
                        <span className="mt-1.5 block text-xs text-muted-foreground">
                          {client.projects.length === 0
                            ? "Sin proyectos"
                            : `${client.projects.length} proyecto${client.projects.length === 1 ? "" : "s"}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        {/* Detalle */}
        <div className="min-w-0 p-4 sm:p-6">
          {!ready ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : selected ? (
            <ClientDetail
              client={selected}
              onStatusChange={(status) => updateClientStatus(selected.id, status)}
              onDelete={() => {
                removeClient(selected.id);
                setSelectedId(null);
                toast.success(`${selected.name} eliminado`);
              }}
              onAddProject={(input) => {
                addProject(selected.id, input);
                toast.success("Proyecto creado");
              }}
              onProjectStatusChange={(projectId, status) =>
                updateProjectStatus(selected.id, projectId, status)
              }
              onDeleteProject={(projectId) => {
                removeProject(selected.id, projectId);
                toast.success("Proyecto eliminado");
              }}
              onAddComment={(projectId, body) => {
                addComment(selected.id, projectId, body);
              }}
            />
          ) : (
            <Card className="mx-auto mt-10 max-w-md">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="grid size-10 place-items-center rounded-md bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </span>
                <div>
                  <p className="text-sm font-medium">Empieza por tu primer cliente</p>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    Añádelo con el botón de arriba. Después podrás abrirle proyectos
                    y dejar comentarios sobre su avance.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
