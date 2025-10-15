"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, Zap, Shield } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#333333] bg-[#0D0D0D]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0D0D0D]/60">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center space-x-3 hover-gold">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#FFD700]">
            <Code className="h-6 w-6 text-[#0D0D0D]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gradient-gold">SniffAI</span>
            <span className="text-xs text-muted-foreground">AI-Powered Code Analysis</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover-gold">
            Dashboard
          </Link>
          <Link href="/test" className="text-sm font-medium hover-gold">
            Quick Test
          </Link>
          <Badge variant="secondary" className="bg-[#333333] text-[#D4AF37] border-[#D4AF37]">
            Beta
          </Badge>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex border-[#333333] hover:border-[#D4AF37] bg-transparent"
          >
            <Shield className="mr-2 h-4 w-4" />
            Security Scan
          </Button>
          <Button size="sm" className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold">
            <Zap className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>
    </header>
  )
}
