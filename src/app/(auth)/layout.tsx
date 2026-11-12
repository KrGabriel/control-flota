import { Brand } from "@/components/layout/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-6">
        <Brand />
      </div>
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        {children}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Sistema privado de SwissNet. Solo personal autorizado.
      </p>
    </div>
  );
}
