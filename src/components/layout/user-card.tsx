"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("No se pudo cerrar la sesión. Intentá de nuevo.");
        return;
      }
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        handleSignOut();
      }}
      disabled={loading}
      variant="destructive"
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      Cerrar sesión
    </DropdownMenuItem>
  );
}

export function UserCard({
  email,
  loading = false,
}: {
  email?: string | null;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        A
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">Administrador</p>
        <p className="truncate text-xs text-muted-foreground">
          {loading ? "Cargando sesión..." : (email ?? "admin")}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Opciones de sesión">
            <span className="sr-only">Opciones de sesión</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <SignOutButton />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2.5">
      <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted-foreground/20" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20" />
        <div className="h-2.5 w-32 animate-pulse rounded bg-muted-foreground/20" />
      </div>
    </div>
  );
}
