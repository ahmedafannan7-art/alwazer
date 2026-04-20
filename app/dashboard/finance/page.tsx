"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Eye,
  Trash2,
  Banknote,
  Building2,
  X,
  Plus,
  Scissors,
  Layers,
  Sparkles,
  MoveRight,
  Box,
  Printer,
  FileText,
  UserPlus,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

type Supplier = {
  id: string
  name: string
  categoryId: string
  categoryName: string
  createdAt: string
}

type SupplierTransaction = {
  id: string
  supplierId: string
  supplierName: string
  supplierCategoryId: string
  supplierCategoryName: string
  amount: number
  date: string
  type: "تنزيل" | "إضافة_مديونية" | "تكلفة_فاتورة" | "سحب_شغل"
  method?: string
  notes?: string
}

type Category = {
  id: string
  name: string
  icon: React.ReactNode
}

const STORAGE_KEYS = {
  suppliers: "suppliers",
  transactions: "transactions",
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [allTransactions, setAllTransactions] = useState<SupplierTransaction[]>([])

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)

  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [newSupplierName, setNewSupplierName] = useState("")

  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("نقدي (كاش)")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [transactionType, setTransactionType] = useState<"تنزيل" | "إضافة_مديونية">("تنزيل")

  const coreCategories: Category[] = [
    { id: "printing", name: "الطباعة", icon: <Printer className="w-5 h-5 text-blue-500" /> },
    { id: "paper", name: "الورق", icon: <FileText className="w-5 h-5 text-amber-600" /> },
    { id: "zincs", name: "الزنكات", icon: <Sparkles className="w-5 h-5 text-cyan-500" /> },
    { id: "emboss", name: "البصمة", icon: <Sparkles className="w-5 h-5 text-yellow-500" /> },
    { id: "lamination", name: "السلوفان", icon: <Layers className="w-5 h-5 text-cyan-500" /> },
    { id: "spot", name: "السبوت", icon: <Box className="w-5 h-5 text-purple-500" /> },
    { id: "riga", name: "الريجا", icon: <MoveRight className="w-5 h-5 text-green-500" /> },
    { id: "cutting", name: "التكسير", icon: <Scissors className="w-5 h-5 text-red-500" /> },
    { id: "dies", name: "الإسطمبات", icon: <Building2 className="w-5 h-5 text-slate-500" /> },
  ]

  const getStoredSuppliers = (): Supplier[] => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.suppliers) || "[]")
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  const getStoredTransactions = (): SupplierTransaction[] => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions) || "[]")
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  const saveSuppliers = (data: Supplier[]) => {
    localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(data))
    setSuppliers(data)
    window.dispatchEvent(new Event("app-data-updated"))
  }

  const saveTransactions = (data: SupplierTransaction[]) => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data))
    setAllTransactions(data)
    window.dispatchEvent(new Event("app-data-updated"))
  }

  const loadData = () => {
    setSuppliers(getStoredSuppliers())
    setAllTransactions(getStoredTransactions())
  }

  useEffect(() => {
    loadData()

    const syncData = () => loadData()

    window.addEventListener("storage", syncData)
    window.addEventListener("app-data-updated", syncData)

    return () => {
      window.removeEventListener("storage", syncData)
      window.removeEventListener("app-data-updated", syncData)
    }
  }, [])

  const formatMoney = (val: number | string) =>
    Number(val || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const formatDate = (date: string) => {
    if (!date) return "---"
    const d = new Date(date)
    if (isNaN(d.getTime())) return date
    return d.toLocaleDateString("en-GB")
  }

  const getSupplierTransactions = (supplierId: string) => {
    return allTransactions.filter((t) => t.supplierId === supplierId)
  }

  const getSupplierBalance = (supplierId: string) => {
    const transactions = getSupplierTransactions(supplierId)

    const owed = transactions
      .filter(
        (t) =>
          t.type === "تكلفة_فاتورة" ||
          t.type === "سحب_شغل" ||
          t.type === "إضافة_مديونية"
      )
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)

    const paid = transactions
      .filter((t) => t.type === "تنزيل")
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)

    return owed - paid
  }

  const totalFactoryDebt = useMemo(() => {
    return suppliers.reduce((acc, supplier) => acc + getSupplierBalance(supplier.id), 0)
  }, [suppliers, allTransactions])

  const handleAddSupplier = () => {
    if (!activeCategory) {
      toast.error("برجاء اختيار القسم أولاً")
      return
    }

    const trimmedName = newSupplierName.trim()
    if (!trimmedName) {
      toast.error("برجاء إدخال اسم المورد")
      return
    }

    const existingSupplier = suppliers.find(
      (s) =>
        s.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        s.categoryId === activeCategory.id
    )

    if (existingSupplier) {
      toast.error("هذا المورد موجود بالفعل داخل نفس القسم")
      return
    }

    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      name: trimmedName,
      categoryId: activeCategory.id,
      categoryName: activeCategory.name,
      createdAt: new Date().toISOString(),
    }

    const updatedSuppliers = [newSupplier, ...suppliers]
    saveSuppliers(updatedSuppliers)

    setNewSupplierName("")
    setIsAddSupplierOpen(false)

    toast.success(`تمت إضافة المورد ${trimmedName} إلى قسم ${activeCategory.name}`)
  }

  const openPaymentDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setTransactionType("تنزيل")
    setPaymentAmount("")
    setPaymentMethod("نقدي (كاش)")
    setPaymentNotes("")
    setIsAddPaymentOpen(true)
  }

  const handleAddTransaction = () => {
    if (!selectedSupplier) {
      toast.error("برجاء اختيار المورد")
      return
    }

    const amount = Number(paymentAmount)

    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      toast.error("أدخل مبلغ صحيح")
      return
    }

    const newTransaction: SupplierTransaction = {
      id: crypto.randomUUID(),
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierCategoryId: selectedSupplier.categoryId,
      supplierCategoryName: selectedSupplier.categoryName,
      amount,
      date: new Date().toISOString(),
      type: transactionType,
      method: paymentMethod,
      notes:
        paymentNotes.trim() ||
        (transactionType === "تنزيل" ? "تسديد دفعة للمورد" : "إضافة مديونية على المورد"),
    }

    const updatedTransactions = [newTransaction, ...allTransactions]
    saveTransactions(updatedTransactions)

    setIsAddPaymentOpen(false)
    setPaymentAmount("")
    setPaymentMethod("نقدي (كاش)")
    setPaymentNotes("")
    setTransactionType("تنزيل")

    toast.success(
      transactionType === "تنزيل"
        ? "تم تسجيل الدفعة بنجاح"
        : "تمت إضافة المديونية بنجاح"
    )
  }

  const deleteSupplier = (id: string) => {
    const supplier = suppliers.find((s) => s.id === id)
    if (!supplier) return

    const relatedTransactions = allTransactions.filter((t) => t.supplierId === id)

    if (relatedTransactions.length > 0) {
      const ok = confirm(
        "هذا المورد لديه حركات مسجلة. هل تريد حذفه مع حذف كل الحركات المرتبطة به؟"
      )
      if (!ok) return

      const updatedSuppliers = suppliers.filter((s) => s.id !== id)
      const updatedTransactions = allTransactions.filter((t) => t.supplierId !== id)

      saveSuppliers(updatedSuppliers)
      saveTransactions(updatedTransactions)

      if (selectedSupplier?.id === id) {
        setSelectedSupplier(null)
        setIsDetailsOpen(false)
      }

      toast.success("تم حذف المورد وكل الحركات المرتبطة به")
      return
    }

    const ok = confirm("هل أنت متأكد من حذف المورد؟")
    if (!ok) return

    const updatedSuppliers = suppliers.filter((s) => s.id !== id)
    saveSuppliers(updatedSuppliers)

    if (selectedSupplier?.id === id) {
      setSelectedSupplier(null)
      setIsDetailsOpen(false)
    }

    toast.success("تم حذف المورد بنجاح")
  }

  return (
    <div className="p-4 md:p-6 space-y-8 text-right bg-slate-50 min-h-screen" dir="rtl">
      {/* الهيدر */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Building2 className="text-blue-600 w-8 h-8" />
            منظومة الموردين والخدمات
          </h1>
          <p className="text-slate-400 font-bold text-sm">
            إدارة الموردين والحسابات مقسمة حسب تخصص المورد
          </p>
        </div>

        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl hidden md:block">
          <p className="text-[10px] opacity-60 font-bold">إجمالي ديون المصنع</p>
          <p className="text-2xl font-black font-mono">{formatMoney(totalFactoryDebt)}</p>
        </div>
      </div>

      {/* الأقسام */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {coreCategories.map((cat) => {
          const categorySuppliers = suppliers.filter((s) => s.categoryId === cat.id)

          return (
            <Card
              key={cat.id}
              className="rounded-3xl border-none shadow-sm overflow-hidden bg-white border-2 border-transparent hover:border-blue-100 transition-all"
            >
              <CardHeader className="bg-slate-50/80 border-b p-5 flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2.5 rounded-2xl shadow-sm">{cat.icon}</div>
                  <CardTitle className="font-black text-xl text-slate-800">
                    قسم {cat.name}
                  </CardTitle>
                </div>

                <Button
                  onClick={() => {
                    setActiveCategory(cat)
                    setIsAddSupplierOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 px-4 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مورد جديد
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50/50 text-slate-400 text-xs font-bold border-b">
                      <tr>
                        <th className="p-4">اسم المورد</th>
                        <th className="p-4 text-left">المديونية</th>
                        <th className="p-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                      {categorySuppliers.map((supplier) => (
                        <tr
                          key={supplier.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-700">{supplier.name}</span>
                              <span className="text-xs text-slate-400 font-bold mt-1">
                                {supplier.categoryName}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-left font-mono font-black text-orange-600">
                            {formatMoney(getSupplierBalance(supplier.id))}
                          </td>

                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                onClick={() => {
                                  setSelectedSupplier(supplier)
                                  setIsDetailsOpen(true)
                                }}
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <Button
                                onClick={() => openPaymentDialog(supplier)}
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white"
                              >
                                <Wallet className="w-4 h-4" />
                              </Button>

                              <Button
                                onClick={() => deleteSupplier(supplier.id)}
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-slate-300 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {categorySuppliers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-300 font-bold italic">
                            لا يوجد موردين مسجلين في هذا القسم
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* نافذة إضافة مورد */}
      <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-right" dir="rtl">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <UserPlus className="text-blue-600" />
              إضافة مورد لـ {activeCategory?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold">اسم المورد / الشركة</Label>
              <Input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="مثال: مطبعة الصفا / شركة النيل للورق"
                className="h-12 rounded-xl border-2 font-bold"
              />
            </div>

            <Button
              onClick={handleAddSupplier}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl"
            >
              حفظ المورد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة كشف الحساب */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 w-full h-full p-0 m-0 overflow-hidden bg-slate-50 flex flex-col"
          dir="rtl"
        >
          <div className="bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center p-6 md:p-8 shrink-0 gap-6">
            <div className="flex-1 text-right">
              <DialogTitle className="text-2xl md:text-3xl font-black">
                {selectedSupplier?.name}
              </DialogTitle>
              <p className="text-blue-400 font-bold mt-1">
                قسم {selectedSupplier?.categoryName}
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => setIsDetailsOpen(false)}
              className="text-white/40 hover:text-white rounded-full h-12 w-12 flex items-center justify-center border border-white/10"
            >
              <X className="w-8 h-8" />
            </Button>
          </div>

          <div className="flex justify-center shrink-0 mb-6">
            <div className="w-full max-w-md px-6">
              <div className="bg-slate-800 p-6 rounded-[1.5rem] shadow-2xl border-2 border-slate-700 w-full text-center">
                <p className="text-xs font-bold opacity-60 mb-2">صافي الحساب الحالي</p>
                <h3 className="text-3xl md:text-4xl font-black font-mono">
                  {formatMoney(getSupplierBalance(selectedSupplier?.id || ""))} ج.م
                </h3>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-right font-bold text-sm md:text-base">
                <thead className="bg-slate-100 text-slate-500 border-b text-right">
                  <tr>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">البيان</th>
                    <th className="p-4">النوع</th>
                    <th className="p-4 text-left">مدين (+)</th>
                    <th className="p-4 text-left">دائن (-)</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {allTransactions
                    .filter((t) => t.supplierId === selectedSupplier?.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="p-4 font-bold text-slate-400">{formatDate(t.date)}</td>
                        <td className="p-4 font-black text-slate-700">{t.notes || "---"}</td>
                        <td className="p-4 font-bold text-slate-500">{t.type}</td>
                        <td className="p-4 text-left font-black text-red-600">
                          {t.type === "تكلفة_فاتورة" ||
                          t.type === "سحب_شغل" ||
                          t.type === "إضافة_مديونية"
                            ? formatMoney(t.amount)
                            : "---"}
                        </td>
                        <td className="p-4 text-left font-black text-green-600">
                          {t.type === "تنزيل" ? formatMoney(t.amount) : "---"}
                        </td>
                      </tr>
                    ))}

                  {allTransactions.filter((t) => t.supplierId === selectedSupplier?.id).length ===
                    0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-300 font-bold italic">
                        لا توجد حركات مسجلة لهذا المورد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة حركة للمورد */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="max-w-md rounded-3xl p-8 text-right border-none shadow-2xl" dir="rtl">
          <DialogHeader className="border-b pb-4 mb-6">
            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Banknote className="text-green-600" />
              حركة مالية للمورد
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="font-black">اسم المورد</Label>
              <div className="h-12 rounded-xl border-2 px-4 flex items-center bg-slate-50 font-black text-slate-700">
                {selectedSupplier?.name || "---"}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-black">نوع الحركة</Label>
              <Select
                value={transactionType}
                onValueChange={(value: "تنزيل" | "إضافة_مديونية") => setTransactionType(value)}
              >
                <SelectTrigger className="h-12 font-bold rounded-xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="تنزيل">💵 تسديد دفعة للمورد</SelectItem>
                  <SelectItem value="إضافة_مديونية">📌 إضافة فلوس عليا للمورد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-black">
                {transactionType === "تنزيل" ? "المبلغ المسدد" : "قيمة المديونية"}
              </Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="h-14 text-2xl font-black text-center border-2 border-green-200 rounded-2xl bg-green-50/30 text-green-700 shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black">طريقة الدفع / الحركة</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 font-bold rounded-xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="نقدي (كاش)">💵 نقدي (كاش)</SelectItem>
                  <SelectItem value="تحويل بنكي">🏦 تحويل بنكي</SelectItem>
                  <SelectItem value="فودافون كاش">📱 فودافون كاش</SelectItem>
                  <SelectItem value="إنستا باي">📱 إنستا باي</SelectItem>
                  <SelectItem value="آجل">🧾 آجل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-black">ملاحظات</Label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder={
                  transactionType === "تنزيل"
                    ? "مثال: دفعة من حساب فاتورة الورق"
                    : "مثال: تكلفة ورق شغل جديد"
                }
                className="h-12 rounded-xl border-2 font-bold"
              />
            </div>

            <Button
              onClick={handleAddTransaction}
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-xl rounded-2xl shadow-xl"
            >
              {transactionType === "تنزيل" ? "تأكيد السداد ✅" : "إضافة المديونية ✅"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}