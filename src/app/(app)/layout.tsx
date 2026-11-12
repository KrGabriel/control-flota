import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { UserCard, UserCardSkeleton } from "@/components/layout/user-card";
import { createClient } from "@/lib/supabase/server";

async function CurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <UserCard email={user.email} />;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userSlot = (
    <Suspense fallback={<UserCardSkeleton />}>
      <CurrentUser />
    </Suspense>
  );

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar userSlot={userSlot} />
      <div className="flex min-h-svh flex-1 flex-col lg:pl-64">
        <AppHeader userSlot={userSlot} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
