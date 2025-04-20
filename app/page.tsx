"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import 'echarts-gl'
import { Apple, BookOpen, Calendar, Clock, ShoppingCart } from "lucide-react"
import dynamic from 'next/dynamic'
import Link from "next/link"
import { useEffect, useState } from "react"

// Dynamically import ECharts to avoid SSR issues
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

export default function Dashboard() {
  const [counts, setCounts] = useState({
    ingredients: 0,
    recipes: 0,
    expiring: 0,
    shopping: 0,
    mealplans: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [ingRes, recRes, expRes, shopRes, mealRes] = await Promise.all([
          fetch('/api/ingredients'),
          fetch('/api/recipes'),
          fetch('/api/notifications?days=7'),
          fetch('/api/shoppinglist'),
          fetch('/api/mealplans'),
        ])
        if (!ingRes.ok || !recRes.ok || !expRes.ok || !shopRes.ok || !mealRes.ok) {
          throw new Error('Erreur lors de la récupération des données')
        }
        const [ings, recs, exps, shops, meals] = await Promise.all([
          ingRes.json(),
          recRes.json(),
          expRes.json(),
          shopRes.json(),
          mealRes.json(),
        ])
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const day = today.getDay()
        const diffToMonday = day === 0 ? -6 : 1 - day
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() + diffToMonday)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        const mealThisWeek = meals.filter((m: { date: string }) => {
          const d = new Date(m.date)
          return d >= startOfWeek && d <= endOfWeek
        })

        setCounts({
          ingredients: Array.isArray(ings) ? ings.length : 0,
          recipes: Array.isArray(recs) ? recs.length : 0,
          expiring: Array.isArray(exps) ? exps.length : 0,
          shopping: Array.isArray(shops) ? shops.length : 0,
          mealplans: mealThisWeek.length,
        })
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCounts()
  }, [])

  if (loading) return <p>Chargement…</p>
  if (error) return <p>Erreur : {error}</p>

  const data = [
    { name: 'Ingredients', value: counts.ingredients },
    { name: 'Recipes', value: counts.recipes },
    { name: 'Expiring', value: counts.expiring },
    { name: 'Shopping', value: counts.shopping },
    { name: 'Meal Plans', value: counts.mealplans },
  ]
  const categories = data.map(item => item.name)
  const values = data.map(item => item.value)

  // ECharts 3D bar config with animation
  const option3D = {
    tooltip: { show: true, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis3D: { type: 'category', data: categories, axisLabel: { rotate: 30 } },
    yAxis3D: { type: 'value' },
    zAxis3D: { type: 'category', data: [''], show: false },
    grid3D: {
      boxWidth: 100,
      boxDepth: 50,
      viewControl: { autoRotate: true, autoRotateSpeed: 20, rotateSensitivity: 1 },
      light: { main: { intensity: 1.2, shadow: true }, ambient: { intensity: 0.3 } },
    },
    series: [
      {
        type: 'bar3D',
        coordinateSystem: 'cartesian3D',
        data: values.map((val, idx) => [idx, val, 0]),
        shading: 'realistic',
        label: { show: true, position: 'top', formatter: '{c}' },
        itemStyle: { color: '#4f46e5' },
        animationDuration: 2000,
      },
    ],
  }

  // ECharts 2D bar chart config
  const option2D = {
    tooltip: { trigger: 'item' },
    xAxis: { type: 'category', data: categories, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      {
        data: values,
        type: 'bar',
        label: { show: true, position: 'top' },
        itemStyle: { color: '#4f46e5' },
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your food management dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/ingredients">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingredients</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.ingredients}</div>
              <p className="text-xs text-muted-foreground">Total ingredients in your pantry</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/recipes">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recipes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.recipes}</div>
              <p className="text-xs text-muted-foreground">Saved recipes in your collection</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/expiration">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.expiring}</div>
              <p className="text-xs text-muted-foreground">Items expiring in the next 7 days</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/shopping-list">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shopping List</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.shopping}</div>
              <p className="text-xs text-muted-foreground">Items to buy on your next shopping trip</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/meal-planning">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meal Planning</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.mealplans}</div>
              <p className="text-xs text-muted-foreground">Meals planned for this week</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Overview 3D</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ReactECharts option={option3D} style={{ width: '100%', height: '100%' }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Overview 2D</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ReactECharts option={option2D} style={{ width: '100%', height: '100%' }} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
