import { SidebarNav } from "@/components/sidebar-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50/50" dir="rtl">
      {/* القائمة الجانبية الديناميكية */}
      <SidebarNav />

      {/* مساحة عرض المحتوى (بتاخد باقي الشاشة) */}
      <main className="flex-1 w-full pt-16 lg:pt-0 overflow-x-hidden transition-all duration-300">
        {children}
      </main>
    </div>
  )
}