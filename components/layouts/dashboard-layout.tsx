"use client"

import type React from "react"

import { Sidebar } from "@/components/layouts/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Dashboard layout with responsive sidebar
 * Shows hamburger menu on mobile, fixed sidebar on desktop
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <span className="text-lg font-semibold">SubTools</span>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 border-r border-border bg-sidebar">
            <Sidebar />
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Content */}
      <main className={cn("min-h-screen transition-all duration-300", isMobile ? "pt-14" : "ml-64")}>
        <div className="mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
