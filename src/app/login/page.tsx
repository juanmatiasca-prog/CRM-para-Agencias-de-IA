"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { authErrorMessage, useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { signIn, user, loading, configured } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Si ya hay sesion, esta pantalla no aporta nada.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Sesión iniciada");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(authErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      description="Entra con el correo y la contraseña de tu cuenta."
      configured={configured}
      footer={
        <>
          ¿Todavía no tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Crear una
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@agencia.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting || !configured}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting || !configured}
          />
        </div>

        <Button type="submit" className="mt-2" disabled={submitting || !configured}>
          {submitting && <Loader2 className="animate-spin" />}
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
