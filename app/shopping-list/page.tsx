"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, ShoppingCart, Trash } from "lucide-react"
import { useEffect, useState } from "react"

type ShoppingItem = {
  id: string
  name: string
  quantity: number
  unit: string
  checked: boolean
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newItem, setNewItem] = useState<Omit<ShoppingItem, "id" | "checked">>({
    name: "",
    quantity: 1,
    unit: "pcs",
  })

  // Chargement initial des données depuis le backend
  useEffect(() => {
    fetch("http://localhost:8080/SmartFood-1.0-SNAPSHOT/api/shoppinglist")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`)
        }
        return res.json()
      })
      .then((data: ShoppingItem[]) => setItems(data))
      .catch((err) => console.error("Erreur lors du chargement des données", err))
  }, [])

  const handleAddItem = () => {
    if (newItem.name.trim() === "" || newItem.quantity <= 0) {
      return
    }

    fetch("http://localhost:8080/SmartFood-1.0-SNAPSHOT/api/shoppinglist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`)
        }
        return res.json()
      })
      .then((createdItem: ShoppingItem) => {
        setItems([...items, createdItem])
        setNewItem({ name: "", quantity: 1, unit: "pcs" })
      })
      .catch((err) => console.error("Erreur lors de l'ajout", err))
  }

  const handleToggleItem = (id: string) => {
    const item = items.find((item) => item.id === id)
    if (!item) return

    const updatedItem = { ...item, checked: !item.checked }

    fetch(`http://localhost:8080/SmartFood-1.0-SNAPSHOT/api/shoppinglist/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedItem),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`)
        }
        return res.json()
      })
      .then((returnedItem: ShoppingItem) => {
        setItems(items.map((it) => (it.id === id ? returnedItem : it)))
      })
      .catch((err) => console.error("Erreur lors de la mise à jour", err))
  }

  const handleDeleteItem = (id: string) => {
    fetch(`http://localhost:8080/SmartFood-1.0-SNAPSHOT/api/shoppinglist/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`)
        }
        setItems(items.filter((item) => item.id !== id))
      })
      .catch((err) => console.error("Erreur lors de la suppression", err))
  }

  const handleClearChecked = () => {
    Promise.all(
      items
        .filter((item) => item.checked)
        .map((item) =>
          fetch(`http://localhost:8080/SmartFood-1.0-SNAPSHOT/api/shoppinglist/${item.id}`, {
            method: "DELETE",
          })
        )
    )
      .then(() => setItems(items.filter((item) => !item.checked)))
      .catch((err) =>
        console.error("Erreur lors du nettoyage des items cochés", err)
      )
  }

  const uncheckedCount = items.filter((item) => !item.checked).length
  const checkedCount = items.filter((item) => item.checked).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-muted-foreground">Keep track of items you need to buy</p>
        </div>
        {checkedCount > 0 && (
          <Button variant="outline" onClick={handleClearChecked}>
            Clear Checked Items
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Item</CardTitle>
            <CardDescription>Add a new item to your shopping list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: Number(e.target.value) })
                    }
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={newItem.unit}
                    onValueChange={(value) =>
                      setNewItem({ ...newItem, unit: value })
                    }
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="ml">Milliliters (ml)</SelectItem>
                      <SelectItem value="l">Liters (l)</SelectItem>
                      <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="can">Can</SelectItem>
                      <SelectItem value="bottle">Bottle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add to List
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shopping Status</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uncheckedCount} items left to buy</div>
            <p className="text-xs text-muted-foreground">{checkedCount} items in cart</p>
            <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shopping List</CardTitle>
          <CardDescription>Check off items as you shop</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Your shopping list is empty
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">To Buy</h3>
                  {items.filter((item) => !item.checked).length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                      All items have been checked off
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {items
                        .filter((item) => !item.checked)
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-md border px-4 py-2">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`item-${item.id}`}
                                checked={item.checked}
                                onCheckedChange={() => handleToggleItem(item.id)}
                              />
                              <Label htmlFor={`item-${item.id}`} className="cursor-pointer text-sm font-medium">
                                {item.name} ({item.quantity} {item.unit})
                              </Label>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {items.filter((item) => item.checked).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">In Cart</h3>
                    <div className="space-y-1">
                      {items
                        .filter((item) => item.checked)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-md border border-dashed bg-muted/50 px-4 py-2"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`item-${item.id}`}
                                checked={item.checked}
                                onCheckedChange={() => handleToggleItem(item.id)}
                              />
                              <Label
                                htmlFor={`item-${item.id}`}
                                className="cursor-pointer text-sm font-medium line-through"
                              >
                                {item.name} ({item.quantity} {item.unit})
                              </Label>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
