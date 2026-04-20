"use client"

import { useState, useMemo } from "react"
import { useExpenses } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Receipt, Trash2, Pencil, Filter } from "lucide-react"
import type { Expense, ExpenseCategory } from "@/lib/types"
import { EXPENSE_CATEGORIES } from "@/lib/types"
import { toast } from "sonner"

export default function ExpensesPage() {
  const { data: expenses, save: saveExpenses, loaded } = useExpenses()
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Form state
  const [formCategory, setFormCategory] = useState<ExpenseCategory>("other")
  const [formDescription, setFormDescription] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])

  const filtered = useMemo(() => {
    let result = [...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    if (categoryFilter !== "all") {
      result = result.filter((e) => e.category === categoryFilter)
    }
    if (dateFrom) {
      result = result.filter((e) => e.date >= dateFrom)
    }
    if (dateTo) {
      result = result.filter((e) => e.date <= dateTo)
    }
    return result
  }, [expenses, categoryFilter, dateFrom, dateTo])

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0)

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const exp of filtered) {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount
    }
    return totals
  }, [filtered])

  function openNewForm() {
    setEditingExpense(null)
    setFormCategory("other")
    setFormDescription("")
    setFormAmount("")
    setFormDate(new Date().toISOString().split("T")[0])
    setFormOpen(true)
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense)
    setFormCategory(expense.category)
    setFormDescription(expense.description)
    setFormAmount(expense.amount.toString())
    setFormDate(expense.date)
    setFormOpen(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(formAmount)
    if (!formDescription.trim() || isNaN(amount) || amount <= 0) {
      toast.error("يرجى ملء جميع الحقول بشكل صحيح")
      return
    }

    if (editingExpense) {
      const updated = expenses.map((exp) =>
        exp.id === editingExpense.id
          ? {
              ...exp,
              category: formCategory,
              description: formDescription.trim(),
              amount,
              date: formDate,
            }
          : exp
      )
      saveExpenses(updated)
      toast.success("تم تعديل المصروف بنجاح")
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        category: formCategory,
        description: formDescription.trim(),
        amount,
        date: formDate,
        createdAt: new Date().toISOString(),
      }
      saveExpenses([...expenses, newExpense])
      toast.success("تم اضافة المصروف بنجاح")
    }
    setFormOpen(false)
  }

  function handleDelete() {
    if (!deleteId) return
    saveExpenses(expenses.filter((e) => e.id !== deleteId))
    setDeleteId(null)
    toast.success("تم حذف المصروف")
  }

  if (!loaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">المصروفات</h1>
          <p className="text-sm text-muted-foreground">
            تتبع مصروفات الشركة ({expenses.length} مصروف)
          </p>
        </div>
        <Button onClick={openNewForm} className="gap-1.5">
          <Plus className="h-4 w-4" />
          اضافة مصروف
        </Button>
      </div>

      {/* Category Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, string][]).map(
          ([key, label]) => (
            <Card key={key} className={categoryFilter === key ? "ring-2 ring-primary" : ""}>
              <CardContent
                className="flex cursor-pointer flex-col gap-1 p-4"
                onClick={() => setCategoryFilter(categoryFilter === key ? "all" : key)}
              >
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold tabular-nums">
                  {(categoryTotals[key] || 0).toLocaleString("ar-EG")} ج.م
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 w-40"
          placeholder="من تاريخ"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 w-40"
          placeholder="الى تاريخ"
        />
        {(dateFrom || dateTo || categoryFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom("")
              setDateTo("")
              setCategoryFilter("all")
            }}
          >
            مسح الفلاتر
          </Button>
        )}
        <div className="mr-auto">
          <p className="text-sm font-medium">
            المجموع: <span className="text-primary font-bold">{totalFiltered.toLocaleString("ar-EG")} ج.م</span>
          </p>
        </div>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">لا توجد مصروفات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((expense) => (
            <Card key={expense.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{expense.description}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {EXPENSE_CATEGORIES[expense.category]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(expense.date).toLocaleDateString("ar-EG")}
                  </p>
                </div>
                <p className="text-lg font-bold tabular-nums text-destructive">
                  {expense.amount.toLocaleString("ar-EG")} ج.م
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditForm(expense)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(expense.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "تعديل المصروف" : "اضافة مصروف جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>التصنيف</Label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, string][]).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>الوصف *</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="وصف المصروف"
                required
                rows={2}
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>المبلغ (ج.م) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>التاريخ *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                الغاء
              </Button>
              <Button type="submit">
                {editingExpense ? "حفظ التعديلات" : "اضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل انت متاكد من حذف هذا المصروف؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>الغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
