"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Apple, BookOpen, Calendar, Clock, Home, ShoppingCart } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Ingredients",
    href: "/ingredients",
    icon: Apple,
  },
  {
    name: "Recipes",
    href: "/recipes",
    icon: BookOpen,
  },
  {
    name: "Expiration",
    href: "/expiration",
    icon: Clock,
  },
  {
    name: "Shopping List",
    href: "/shopping-list",
    icon: ShoppingCart,
  },
  {
    name: "Meal Planning",
    href: "/meal-planning",
    icon: Calendar,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-background md:block w-64">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">Food Manager</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    pathname === item.href ? "font-medium" : "font-normal",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
