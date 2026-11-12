"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Completá el correo electrónico y la contraseña.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.status === 400) {
          setError("Credenciales incorrectas. Verificá el correo y la contraseña.");
        } else if (authError.status === 429) {
          setError("Demasiados intentos. Esperá unos minutos y volvé a intentar.");
        } else {
          setError(authError.message);
        }
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      toast.error("Error de conexión", {
        description: "No se pudo conectar con el servidor. Revisá tu conexión a internet.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-lg font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">
          Ingresá con tu correo y contraseña de administrador.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="admin@swissnet.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Olvidaste tu contraseña?{" "}
        <Link href="/recuperar-contrasena" className="font-medium text-primary hover:underline">
          Recuperar acceso
        </Link>
      </p>
    </div>
  );
}
