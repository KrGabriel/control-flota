"use client"

import { Suspense } from "react"
import { cn } from "cn"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Brand } from "@/components/layout/brand"
import { UserCardSkeleton } from "@/components/layout/user-card"

export function AppSidebar({
  className,
  userSlot,
}: {
  className?: string
  userSlot?: React.ReactNode
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar lg:flex",
        className
      )}
    >
      <div className="py-4">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <Suspense fallback={null}>
          <SidebarNav />
        </Suspense>
      </div>
      <div className="border-t p-3">
        {userSlot ?? <UserCardSkeleton />}
      </div>
    </aside>
  )
}
