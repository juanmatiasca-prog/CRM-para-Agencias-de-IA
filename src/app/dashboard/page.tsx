"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, MessageSquare, Users } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClients } from "@/hooks/use-clients";
import { countComments, countProjects } from "@/lib/storage";
import { navItems } from "@/lib/nav";

export default function DashboardPage() {
  const { user } = useAuth();
  const { clients, ready } = useClients();

  const firstName = (user?.displayName || user?.email || "").split(/[\s@]/)[0];

  const stats = [
    {
      label: "Clientes",
      value: clients.length,
      icon: Users,
      href: "/dashboard/clientes",
    },
    {
      label: "Proyectos",
      value: countProjects(clients),
      icon: FolderKanban,
      href: "/dashboard/clientes",
    },
    {
      label: "Comentarios",
      value: countComments(clients),
      icon: MessageSquare,
      href: "/dashboard/clientes",
    },
  ];

  const pending = navItems.filter((item) => !item.ready);

  return (
    <>
      <PageHeader
        title="Resumen"
        description={firstName ? `Hola, ${firstName}` : undefined}
      />

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <stat.icon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-semibold tabular-nums">
                  {ready ? stat.value : "—"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert>
          <AlertTitle>Los datos se guardan en este navegador</AlertTitle>
          <AlertDescription>
            Todavía no hay base de datos conectada. Lo que crees aquí vive en el
            almacenamiento local de este navegador: no se comparte con tu equipo ni
            viaja a otros dispositivos, y se pierde si borras los datos del sitio.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empieza por los clientes</CardTitle>
            <CardDescription>
              La pestaña de clientes es la única activa. Dentro de cada cliente
              puedes abrir proyectos y comentar su avance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/clientes">
                Ir a Clientes
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pestañas en camino</CardTitle>
            <CardDescription>
              Aparecen desactivadas en el menú lateral hasta que se construyan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {pending.map((item) => (
                <li key={item.href} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-muted">
                    <item.icon className="size-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
