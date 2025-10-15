import type React from "react"
import { Header } from "./header"
import { Footer } from "./footer"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
