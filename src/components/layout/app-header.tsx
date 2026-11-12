"use client"

import { Suspense, useState } from "react"
import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Brand } from "@/components/layout/brand"
import { UserCardSkeleton } from "@/components/layout/user-card"
import { Badge } from "@/components/ui/badge"

export function AppHeader({ userSlot }: { userSlot?: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Abrir menú de navegación"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-xs font-bold text-primary-foreground">
          SN
        </div>
        <span className="font-heading text-sm font-semibold">SwissNet</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificaciones"
        >
          <Bell className="size-4.5" />
        </Button>
        <Badge
          variant="secondary"
          className="hidden text-xs sm:inline-flex"
        >
          Sin notificaciones
        </Badge>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0 sm:max-w-xs">
          <SheetHeader className="border-b">
            <SheetTitle asChild>
              <div>
                <Brand />
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <Suspense fallback={null}>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </Suspense>
          </div>
          <div className="border-t p-3">
            {userSlot ?? <UserCardSkeleton />}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
