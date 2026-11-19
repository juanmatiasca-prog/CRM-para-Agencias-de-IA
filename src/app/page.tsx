import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  FolderKanban,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Clientes en un sitio",
    body: "Ficha por cliente con contacto, sector y estado. Sin hojas de cálculo repartidas entre carpetas.",
  },
  {
    icon: FolderKanban,
    title: "Proyectos por cliente",
    body: "Cada cliente agrupa sus proyectos con estado y presupuesto, del discovery a la entrega.",
  },
  {
    icon: MessageSquare,
    title: "Comentarios con historial",
    body: "El seguimiento vive junto al proyecto, con autor y fecha, no en un hilo de correo perdido.",
  },
  {
    icon: Bot,
    title: "Pensado para agencias de IA",
    body: "El ciclo discovery, PoC y producción no encaja en un CRM genérico. Aquí sí.",
  },
  {
    icon: BarChart3,
    title: "Lo que el margen esconde",
    body: "Un CRM conoce el precio. Esto está diseñado para conocer también el coste y la capacidad.",
  },
  {
    icon: ShieldCheck,
    title: "Acceso con Firebase",
    body: "Autenticación por correo y contraseña gestionada por Firebase Authentication.",
  },
];

const steps = [
  {
    step: "01",
    title: "Crea tu cuenta",
    body: "Alta con correo y contraseña. Cada usuario ve su propio espacio de trabajo.",
  },
  {
    step: "02",
    title: "Añade tus clientes",
    body: "Nombre, empresa, sector y contacto. Lo mínimo para empezar a trabajar hoy.",
  },
  {
    step: "03",
    title: "Abre proyectos y comenta",
    body: "Dentro de cada cliente, abre proyectos y deja comentarios con el avance.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Crear cuenta</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-radial-[at_50%_0%] from-primary/10 to-transparent to-70%"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6">
                CRM para agencias de IA
              </Badge>
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                El CRM que entiende cómo{" "}
                <span className="text-primary">factura una agencia de IA</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
                Clientes, proyectos y seguimiento en un solo lugar. Construido a
                medida, porque el ciclo de discovery, prueba de concepto y
                producción no cabe en un pipeline genérico de cinco etapas.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Empezar ahora
                    <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Ya tengo cuenta</Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <li className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-primary" />
                  Sin tarjeta
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-primary" />
                  Acceso con Firebase
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-primary" />
                  Código abierto
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Lo que hace distinto a este CRM
              </h2>
              <p className="mt-4 text-muted-foreground text-pretty">
                Un CRM genérico sabe el precio al que vendiste. Una agencia
                necesita saber además qué costó entregarlo. Esa diferencia es todo
                el proyecto.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="h-full">
                  <CardHeader>
                    <div className="mb-2 grid size-9 place-items-center rounded-md bg-muted">
                      <feature.icon className="size-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-pretty">
                      {feature.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Tres pasos para empezar
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((item) => (
                <div key={item.step} className="relative">
                  <span className="font-mono text-sm font-medium text-primary">
                    {item.step}
                  </span>
                  <h3 className="mt-3 font-heading text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground text-pretty">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center gap-6 px-6 py-14 text-center">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  Deja la hoja de cálculo esta semana
                </h2>
                <p className="max-w-xl text-muted-foreground text-pretty">
                  Crea tu cuenta, añade tu primer cliente y abre un proyecto. No
                  necesitas migrar nada para probarlo.
                </p>
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Crear mi cuenta
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo className="text-sm" />
          <p className="text-xs text-muted-foreground">
            Construido con Next.js, shadcn/ui y Firebase.
          </p>
        </div>
      </footer>
    </div>
  );
}
