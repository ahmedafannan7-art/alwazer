"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Users, FileText,
  LogOut, Wallet, Menu, X, Box, ChevronRight, ChevronLeft
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "العملاء والشركات", icon: Users },
  { href: "/dashboard/invoices", label: "الفواتير والتشغيل", icon: FileText },
  { href: "/dashboard/finance", label: "الحسابات والديون", icon: Wallet },
  { href: "/dashboard/printing-materials", label: "خامات الطباعة", icon: Box },
]

export function SidebarNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  async function handleLogout() {
    try {
      await signOut(auth)
      toast.success("تم تسجيل الخروج")
      router.replace("/login")
    } catch {
      toast.error("حدث خطأ أثناء تسجيل الخروج")
    }
  }

  const NavContent = ({ isMobile = false }) => (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300 transition-all duration-300" dir="rtl">
      {/* اللوجو */}
      <div className={cn("flex items-center border-b border-slate-800 py-6 bg-slate-900 transition-all duration-300", isCollapsed && !isMobile ? "justify-center px-0" : "px-6 gap-4")}>
        <div className={cn("flex items-center justify-center rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-900 shrink-0 transition-all duration-300", isCollapsed && !isMobile ? "w-10 h-10 text-lg" : "w-12 h-12 text-xl")}>م</div>
        {(!isCollapsed || isMobile) && (
          <div className="overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
            <h2 className="text-lg font-black text-white">حسابات</h2>
            <p className="text-xs text-blue-400 font-bold">مطبعة الوزير</p>
          </div>
        )}
        {isMobile && <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="mr-auto text-white"><X className="h-6 w-6" /></Button>}
      </div>

      {/* الروابط */}
      <nav className="flex-1 overflow-y-auto py-6 overflow-x-hidden">
        <ul className="flex flex-col gap-2 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  title={isCollapsed && !isMobile ? item.label : ""}
                  className={cn(
                    "flex items-center rounded-2xl py-3.5 transition-all duration-200 group",
                    isActive ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-800 hover:text-white",
                    isCollapsed && !isMobile ? "justify-center px-0" : "px-4 gap-4"
                  )}
                >
                  <item.icon className={cn("shrink-0 transition-all", isCollapsed && !isMobile ? "w-6 h-6" : "w-5 h-5")} />
                  {(!isCollapsed || isMobile) && <span className="font-black whitespace-nowrap text-right flex-1">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* معلومات المستخدم + تسجيل الخروج */}
      <div className="border-t border-slate-800 p-4 flex flex-col gap-2">
        {(!isCollapsed || isMobile) && user?.email && (
          <p className="text-xs text-slate-500 truncate px-1 text-center" dir="ltr">
            {user.email}
          </p>
        )}
        <button
          onClick={handleLogout}
          title={isCollapsed && !isMobile ? "تسجيل الخروج" : ""}
          className={cn(
            "flex w-full items-center rounded-2xl py-3.5 text-sm font-black text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all",
            isCollapsed && !isMobile ? "justify-center px-0" : "px-4 gap-3 justify-end"
          )}
        >
          {(!isCollapsed || isMobile) && <span className="whitespace-nowrap">تسجيل الخروج</span>}
          <LogOut className={cn("shrink-0", isCollapsed && !isMobile ? "w-6 h-6" : "w-5 h-5")} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden shadow-sm" dir="rtl">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}><Menu className="h-6 w-6" /></Button>
        <h1 className="text-sm font-black text-slate-800">مطبعة الوزير</h1>
      </div>

      <aside className={cn(
        "sticky top-0 h-screen z-30 hidden lg:flex flex-col transition-all duration-300 ease-in-out border-l border-slate-800 shrink-0",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <NavContent />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3.5 top-10 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-500 transition-all z-50 focus:outline-none"
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 right-0 bottom-0 w-72 shadow-2xl animate-in slide-in-from-right">
            <NavContent isMobile={true} />
          </aside>
        </div>
      )}
    </>
  )
}
