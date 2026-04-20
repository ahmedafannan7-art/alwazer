"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react"

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCosts: 0,
    netProfit: 0,
    customerDebts: 0,
    supplierDebts: 0
  })

  useEffect(() => {
    const suppliers = JSON.parse(localStorage.getItem("suppliers") || "[]")
    const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    
    // حساب الديون
    const cDebts = suppliers.filter((s:any) => s.category === "زبون").reduce((acc:any, s:any) => acc + (s.totalOwed - s.totalPaid), 0)
    const sDebts = suppliers.filter((s:any) => s.category !== "زبون").reduce((acc:any, s:any) => acc + (s.totalOwed - s.totalPaid), 0)
    
    // حساب مبيعات وتكاليف اليوم (من الحركات المالية)
    const today = new Date().toLocaleDateString("ar-EG")
    const todayTrans = transactions.filter((t:any) => t.date === today && t.type === "سحب_شغل")
    
    // ملاحظة: المبيعات هي إجمالي ما سحبه الزبائن، والتكاليف هي ما سحبناه من الموردين
    const sales = todayTrans.filter((t:any) => suppliers.find((s:any) => s.id === t.supplierId)?.category === "زبون").reduce((acc:any, t:any) => acc + t.amount, 0)
    const costs = todayTrans.filter((t:any) => suppliers.find((s:any) => s.id === t.supplierId)?.category !== "زبون").reduce((acc:any, t:any) => acc + t.amount, 0)

    setStats({
      totalSales: sales,
      totalCosts: costs,
      netProfit: sales - costs,
      customerDebts: cDebts,
      supplierDebts: sDebts
    })
  }, [])

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-black flex items-center gap-2"><BarChart3 className="text-blue-600"/> تقارير الأداء والأرباح</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
        <Card className="bg-blue-600 text-white rounded-[2rem] shadow-xl">
          <CardContent className="pt-8">
            <TrendingUp className="mb-2 opacity-50"/>
            <p className="text-sm font-bold opacity-80">مبيعات اليوم</p>
            <h2 className="text-4xl font-black">{stats.totalSales.toLocaleString()} ج.م</h2>
          </CardContent>
        </Card>

        <Card className="bg-green-600 text-white rounded-[2rem] shadow-xl">
          <CardContent className="pt-8">
            <TrendingUp className="mb-2 opacity-50"/>
            <p className="text-sm font-bold opacity-80">صافي ربح اليوم (متوقع)</p>
            <h2 className="text-4xl font-black">{stats.netProfit.toLocaleString()} ج.م</h2>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white rounded-[2rem] shadow-xl">
          <CardContent className="pt-8">
            <Wallet className="mb-2 opacity-50"/>
            <p className="text-sm font-bold opacity-80">إجمالي ديون الزبائن</p>
            <h2 className="text-4xl font-black text-blue-400">{stats.customerDebts.toLocaleString()} ج.م</h2>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="rounded-[2rem] border-none shadow-sm bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-red-700">ديون الموردين</CardTitle><ArrowUpCircle className="text-red-400"/></CardHeader>
            <CardContent><h3 className="text-3xl font-black text-red-800">{stats.supplierDebts.toLocaleString()} ج.م</h3></CardContent>
         </Card>
         <Card className="rounded-[2rem] border-none shadow-sm bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-blue-700">شغل اليوم الفعلي</CardTitle><ArrowDownCircle className="text-blue-400"/></CardHeader>
            <CardContent><h3 className="text-3xl font-black text-blue-800">{stats.totalSales.toLocaleString()} ج.م</h3></CardContent>
         </Card>
      </div>
    </div>
  )
}