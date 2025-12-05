"use client"

import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Receipt,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Fee {
  id: string
  category: string
  description: string | null
  amount: number
  paidAmount: number
  dueDate: Date | null
  status: string
  currency: string
}

interface Payment {
  id: string
  amount: number
  method: string
  receiptNumber: string | null
  notes: string | null
  date: Date
}

interface FeesClientProps {
  fees: Fee[]
  payments: Payment[]
  summary: {
    totalFees: number
    totalPaid: number
    totalDue: number
  }
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "PAID":
      return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100", label: "Paid" }
    case "PARTIAL":
      return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-100", label: "Partial" }
    case "UNPAID":
      return { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-100", label: "Unpaid" }
    case "OVERDUE":
      return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100", label: "Overdue" }
    default:
      return { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-100", label: status }
  }
}

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function FeesClient({ fees, payments, summary }: FeesClientProps) {
  const paymentPercentage = summary.totalFees > 0
    ? Math.round((summary.totalPaid / summary.totalFees) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fees & Payments</h1>
        <p className="text-muted-foreground mt-1">
          View your fee balances and payment history.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalFees)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalDue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card className="neu-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Progress</span>
              <span className="text-sm text-muted-foreground">{paymentPercentage}% paid</span>
            </div>
            <Progress value={paymentPercentage} className="h-4" />
          </div>
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      <Card className="neu-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Fee Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => {
                  const config = getStatusConfig(fee.status)
                  const balance = fee.amount - fee.paidAmount
                  
                  return (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fee.category}</p>
                          {fee.description && (
                            <p className="text-xs text-muted-foreground">{fee.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(fee.amount, fee.currency)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(fee.paidAmount, fee.currency)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(balance, fee.currency)}
                      </TableCell>
                      <TableCell>
                        {fee.dueDate 
                          ? new Date(fee.dueDate).toLocaleDateString()
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "gap-1",
                            fee.status === "PAID" && "border-green-200 text-green-600",
                            fee.status === "PARTIAL" && "border-yellow-200 text-yellow-600",
                            fee.status === "UNPAID" && "border-gray-200 text-gray-600",
                            fee.status === "OVERDUE" && "border-red-200 text-red-600"
                          )}
                        >
                          <config.icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">No fees assigned</h3>
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any fee assignments yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="neu-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {payment.method.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.receiptNumber || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {payment.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">No payment history</h3>
              <p className="text-sm text-muted-foreground">
                No payments have been recorded yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
