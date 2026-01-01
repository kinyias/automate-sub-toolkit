"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Languages, Youtube, FileText, MoreHorizontal, Subtitles, ChevronLeft, ChevronRight, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

/**
 * Navigation items configuration
 */
const navItems = [
  {
    href: "/translate",
    label: "Translate Subtitles",
    icon: Languages,
    description: ".srt files",
  },
    {
    href: "/converter",
    label: "JSON to SRT",
    icon: FileJson,
    description: "CapCut draft files",
  },
  {
    href: "/youtube",
    label: "YouTube Keyword Tool",
    icon: Youtube,
    description: "YouTube video keywords",
  },
  {
    href: "/youtubeseo",
    label: "YouTube SEO Tool",
    icon: Youtube,
    description: "YouTube video SEO",
  },
  {
    href: "/script",
    label: "AI Script Generator",
    icon: FileText,
    description: ".srt files",
  },
  {
    href: "/more",
    label: "More Tools",
    icon: MoreHorizontal,
    description: "Coming soon",
  },
]

/**
 * Sidebar component with navigation and responsive collapse
 */
export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Subtitles className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-sidebar-foreground">SubTools</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto">
              <Subtitles className="h-6 w-6 text-primary" />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && (
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
