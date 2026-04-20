export interface Client {
  id: string
  name: string
  phone: string
  company: string
  notes: string
  createdAt: string
}

export interface InvoiceItem {
  name: string
  qty: number
  unitPrice: number
  cost: number
  total: number
  paperSupplierId?: string
  printSupplierId?: string
  zinkSupplierId?: string
  embossSupplierId?: string
  laminationSupplierId?: string
  spotSupplierId?: string
  rigaSupplierId?: string
  cuttingSupplierId?: string
  diesSupplierId?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  clientName: string
  date: string
  items: InvoiceItem[]
  totalPrice: number
  totalCost: number
  createdAt: string
  notes?: string
}

export type ExpenseCategory = "rent" | "salaries" | "materials" | "ads" | "other"

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  createdAt: string
}

export interface PrintingPrice {
  id: string
  service: string
  price: number
  unit: string
  notes: string
}

export interface SocialMediaPackage {
  id: string
  name: string
  tier: "basic" | "standard" | "premium"
  price: number
  features: string[]
}

export interface Supplier {
  id: string
  name: string
  categoryId: string
  categoryName: string
  createdAt: string
}

export interface SupplierTransaction {
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
  invoiceId?: string
}

export interface ClientTransaction {
  id: string
  clientId: string
  clientName: string
  amount: number
  date: string
  type: "تنزيل" | "فاتورة"
  method?: string
  notes?: string
  invoiceId?: string
}

export interface AppSettings {
  companyName: string
  companyPhone: string
  companyAddress: string
  taxRate: number
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  rent: "ايجار",
  salaries: "رواتب",
  materials: "مواد خام",
  ads: "اعلانات",
  other: "اخرى",
}

export const SUPPLIER_CATEGORIES = [
  { id: "printing", name: "الطباعة" },
  { id: "paper", name: "الورق" },
  { id: "zincs", name: "الزنكات" },
  { id: "emboss", name: "البصمة" },
  { id: "lamination", name: "السلوفان" },
  { id: "spot", name: "السبوت" },
  { id: "riga", name: "الريجا" },
  { id: "cutting", name: "التكسير" },
  { id: "dies", name: "الإسطمبات" },
]

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: "مطبعة الوزير",
  companyPhone: "01000000000",
  companyAddress: "جمهورية مصر العربية",
  taxRate: 0,
}
