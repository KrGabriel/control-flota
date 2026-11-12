"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

interface PlaceholderButtonProps {
  label: string
  stage: string
  className?: string
}

export function PlaceholderButton({ label, stage, className }: PlaceholderButtonProps) {
  return (
    <Button
      className={cn("w-full sm:w-auto", className)}
      onClick={() =>
        toast.info("Función en desarrollo", {
          description: `Estará disponible en la ${stage}.`,
        })
      }
    >
      {label}
    </Button>
  )
}
