"use client"

import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#333333] mb-4">
        <Icon className="h-10 w-10 text-[#D4AF37]" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold">
          {action.label}
        </Button>
      )}
    </div>
  )
}
