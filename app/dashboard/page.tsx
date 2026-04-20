"use client"

import { useInvoices, useExpenses, useClients, useSuppliers, useSupplierTransactions, useClientTransactions } from "@/lib/store"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Receipt, Users, TrendingUp, TrendingDown, Wallet, Building2, FileText } from "lucide-react"
import { useMemo } from "react"

export default function DashboardPage() {
  const { invoices, loading: invLoading } = useInvoices()
  const { expenses, loading: expLoading } = useExpenses()
  const { clients } = useClients()
  const { suppliers } = useSuppliers()
  const { transactions: supTxs } = useSupplierTransactions()
  const { transactions: cliTxs } = useClientTransactions()

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((s, inv) => s + (inv.totalPrice || 0), 0)
    const totalCosts = invoices.reduce((s, inv) => s + (inv.totalCost || 0), 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const netProfit = totalRevenue - totalCosts - totalExpenses

    // Client debts
    const clientDebts = clients.reduce((sum, c) => {
      const invTotal = invoices.filter((inv) => inv.customerId === c.id).reduce((s, inv) => s + inv.totalPrice, 0)
      const paid = cliTxs.filter((t) => t.clientId === c.id && t.type === "تنزيل").reduce((s, t) => s + t.amount, 0)
      return sum + Math.max(0, invTotal - paid)
    }, 0)

    // Supplier debts
    const supplierDebts = suppliers.reduce((sum, s) => {
      const owed = supTxs.filter((t) => t.supplierId === s.id && (t.type === "تكلفة_فاتورة" || t.type === "إضافة_مديونية")).reduce((a, t) => a + t.amount, 0)
      const paid = supTxs.filter((t) => t.supplierId === s.id && t.type === "تنزيل").reduce((a, t) => a + t.amount, 0)
      return sum + Math.max(0, owed - paid)
    }, 0)

    return { totalRevenue, totalCosts, totalExpenses, netProfit, clientDebts, supplierDebts }
  }, [invoices, expenses, clients, suppliers, supTxs, cliTxs])

  const formatMoney = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  if (invLoading || expLoading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  const recentInvoices = invoices.slice(0, 5)

  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">نظرة عامة على أداء الشركة</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/invoices"><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> فاتورة جديدة</Button></Link>
          <Link href="/dashboard/expenses"><Button size="sm" variant="outline" className="gap-1.5"><Receipt className="h-4 w-4" /> مصروف جديد</Button></Link>
          <Link href="/dashboard/clients"><Button size="sm" variant="outline" className="gap-1.5"><Users className="h-4 w-4" /> عميل جديد</Button></Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-sm bg-blue-600 text-white">
          <CardContent className="pt-6">
            <TrendingUp className="mb-2 opacity-70 w-6 h-6" />
            <p className="text-sm font-bold opacity-80">إجمالي المبيعات</p>
            <h2 className="text-3xl font-black mt-1">{formatMoney(stats.totalRevenue)}</h2>
            <p className="text-xs opacity-60 mt-1">ج.م</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-green-600 text-white">
          <CardContent className="pt-6">
            <TrendingUp className="mb-2 opacity-70 w-6 h-6" />
            <p className="text-sm font-bold opacity-80">صافي الربح</p>
            <h2 className="text-3xl font-black mt-1">{formatMoney(stats.netProfit)}</h2>
            <p className="text-xs opacity-60 mt-1">ج.م</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-red-500 text-white">
          <CardContent className="pt-6">
            <TrendingDown className="mb-2 opacity-70 w-6 h-6" />
            <p className="text-sm font-bold opacity-80">إجمالي المصروفات</p>
            <h2 className="text-3xl font-black mt-1">{formatMoney(stats.totalExpenses)}</h2>
            <p className="text-xs opacity-60 mt-1">ج.م</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <Building2 className="mb-2 text-blue-500 w-6 h-6" />
            <p className="text-sm font-bold text-muted-foreground">ديون العملاء</p>
            <h2 className="text-3xl font-black mt-1 text-red-600">{formatMoney(stats.clientDebts)}</h2>
            <p className="text-xs text-muted-foreground mt-1">ج.م - {clients.length} عميل</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <Wallet className="mb-2 text-orange-500 w-6 h-6" />
            <p className="text-sm font-bold text-muted-foreground">ديون الموردين</p>
            <h2 className="text-3xl font-black mt-1 text-orange-600">{formatMoney(stats.supplierDebts)}</h2>
            <p className="text-xs text-muted-foreground mt-1">ج.م - {suppliers.length} مورد</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <FileText className="mb-2 text-slate-500 w-6 h-6" />
            <p className="text-sm font-bold text-muted-foreground">إجمالي الفواتير</p>
            <h2 className="text-3xl font-black mt-1">{invoices.length}</h2>
            <p className="text-xs text-muted-foreground mt-1">فاتورة محفوظة</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> آخر الفواتير</CardTitle></CardHeader>
        <CardContent className="p-0">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-2 opacity-20" /><p className="text-sm font-medium">لا توجد فواتير بعد</p></div>
          ) : (
            <div className="divide-y">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                  <div>
                    <p className="font-bold text-sm">{inv.clientName}</p>
                    <p className="text-xs text-muted-foreground">{inv.date} | {inv.invoiceNumber}</p>
                  </div>
                  <span className="font-black text-blue-700">{formatMoney(inv.totalPrice)} ج</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
