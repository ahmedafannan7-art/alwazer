"use client"

import { useInvoices, useExpenses } from "@/lib/store"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Receipt, Users } from "lucide-react"

export default function DashboardPage() {
  const { data: invoices, loaded: invLoaded } = useInvoices()
  const { data: expenses, loaded: expLoaded } = useExpenses()

  if (!invLoaded || !expLoaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">
            نظرة عامة على اداء الشركة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/invoices/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              فاتورة جديدة
            </Button>
          </Link>
          <Link href="/dashboard/expenses">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Receipt className="h-4 w-4" />
              اضافة مصروف
            </Button>
          </Link>
          <Link href="/dashboard/clients">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Users className="h-4 w-4" />
              عميل جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsCards invoices={invoices} expenses={expenses} />

      {/* Charts and Recent */}
      <div className="grid gap-6 xl:grid-cols-2">
        <MonthlyChart invoices={invoices} expenses={expenses} />
        <RecentInvoices invoices={invoices} />
      </div>
    </div>
  )
}
