"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface NewClientInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  notes: string;
}

const EMPTY: NewClientInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  industry: "",
  notes: "",
};

export function NewClientDialog({
  onCreate,
}: {
  onCreate: (input: NewClientInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewClientInput>(EMPTY);

  function update<K extends keyof NewClientInput>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;
    onCreate(form);
    setForm(EMPTY);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setForm(EMPTY);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Nuevo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
            <DialogDescription>
              Solo el nombre es obligatorio. El resto puedes completarlo después.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client-name">Nombre de contacto *</Label>
              <Input
                id="client-name"
                required
                autoFocus
                placeholder="Ana García"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-company">Empresa</Label>
              <Input
                id="client-company"
                placeholder="Acme Industrial"
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="client-email">Correo</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="ana@acme.com"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-phone">Teléfono</Label>
                <Input
                  id="client-phone"
                  placeholder="+34 600 000 000"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-industry">Sector</Label>
              <Input
                id="client-industry"
                placeholder="Industrial, retail, salud…"
                value={form.industry}
                onChange={(event) => update("industry", event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-notes">Notas</Label>
              <Textarea
                id="client-notes"
                rows={3}
                placeholder="Cómo llegó, qué necesita, de qué habéis hablado…"
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!form.name.trim()}>
              Crear cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
