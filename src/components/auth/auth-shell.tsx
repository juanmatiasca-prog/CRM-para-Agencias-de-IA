import Link from "next/link";

import { Logo } from "@/components/landing/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Marco comun de las pantallas de acceso: logo, tarjeta centrada y pie. */
export function AuthShell({
  title,
  description,
  children,
  footer,
  configured = true,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  configured?: boolean;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 px-4 py-12">
      <Link href="/" aria-label="Volver al inicio">
        <Logo />
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!configured && (
            <Alert variant="destructive">
              <AlertDescription>
                Falta la configuración de Firebase. Copia <code>.env.example</code>{" "}
                a <code>.env.local</code> y rellena las variables{" "}
                <code>NEXT_PUBLIC_FIREBASE_*</code>.
              </AlertDescription>
            </Alert>
          )}
          {children}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}
