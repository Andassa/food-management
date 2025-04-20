"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock } from "lucide-react"
import { useEffect, useState } from "react"

type IngredientWithExpiration = {
  id: string
  name: string
  quantity: number
  unit: string
  expirationDate: string
}

export default function ExpirationPage() {
  const [ingredients, setIngredients] = useState<IngredientWithExpiration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/ingredients')
      .then(res => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        return res.json()
      })
      .then((data: IngredientWithExpiration[]) => {
        data.sort((a, b) =>
          new Date(a.expirationDate).getTime() -
          new Date(b.expirationDate).getTime()
        )
        setIngredients(data)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getExpirationStatus = (expirationDate: string) => {
    const expDate = new Date(expirationDate)
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: "Expired",  colorClass: "bg-red-600 text-white" }
    } else if (diffDays <= 3) {
      return { label: "Critical", colorClass: "bg-orange-600 text-white" }
    } else if (diffDays <= 7) {
      return { label: "Warning",     colorClass: "bg-yellow-600 text-black" }
    } else {
      return { label: "Good",     colorClass: "bg-green-600 text-white" }
    }
  }

  if (loading) return <p>Chargement…</p>
  if (error)   return <p>Erreur : {error}</p>

  const stats = {
    expired:  ingredients.filter(i => getExpirationStatus(i.expirationDate).label === "Expired").length,
    critical: ingredients.filter(i => getExpirationStatus(i.expirationDate).label === "Critical").length,
    warning:  ingredients.filter(i => getExpirationStatus(i.expirationDate).label === "Warning").length,
    good:     ingredients.filter(i => getExpirationStatus(i.expirationDate).label === "Good").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expiration Tracking</h1>
        <p className="text-muted-foreground">Monitor ingredient expiration dates</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: "Expired",        count: stats.expired,  colorClass: "bg-red-600 text-white" },
          { title: "Critical (≤3j)", count: stats.critical, colorClass: "bg-orange-600 text-white" },
          { title: "Warning (≤7j)",  count: stats.warning,  colorClass: "bg-yellow-600 text-black" },
          { title: "Good",           count: stats.good,     colorClass: "bg-green-600 text-white" },
        ].map(({ title, count, colorClass }) => (
          <Card key={title} className="flex flex-col items-center justify-center py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expiration Dates</CardTitle>
          <CardDescription>Track when your ingredients will expire</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map(i => {
                const { label, colorClass } = getExpirationStatus(i.expirationDate)
                const expDate = new Date(i.expirationDate)
                const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell>{i.quantity} {i.unit}</TableCell>
                    <TableCell>{expDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={`${colorClass}`}>{label}</Badge>
                    </TableCell>
                    <TableCell className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      {diffDays < 0
                        ? `${Math.abs(diffDays)} days ago`
                        : diffDays === 0
                          ? "Today"
                          : `${diffDays} days`}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
