"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash } from "lucide-react"
import { useEffect, useState } from "react"

type Ingredient = {
  id: string
  name: string
  quantity: number
  unit: string
  expirationDate: string
}

// Au démarrage, notre état est vide (les données seront chargées depuis le backend)
export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [newIngredient, setNewIngredient] = useState<Omit<Ingredient, "id">>({
    name: "",
    quantity: 0,
    unit: "g",
    expirationDate: ""
  })
  const [open, setOpen] = useState(false)

  // Charger les ingrédients depuis le backend via l'endpoint /api/ingredients
  useEffect(() => {
    fetch('/api/ingredients')
      .then(res => res.json())
      .then((data: Ingredient[]) => setIngredients(data))
      .catch(error => console.error("Erreur lors du chargement des ingrédients:", error))
  }, [])

  // Gérer l'ajout d'un ingrédient
  const handleAddIngredient = () => {
    if (
      newIngredient.name.trim() === "" ||
      newIngredient.quantity <= 0 ||
      newIngredient.expirationDate === ""
    ) {
      return
    }

    // Appel POST vers /api/ingredients
    fetch('/api/ingredients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newIngredient)
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur à la création")
        return res.json()
      })
      .then((created: Ingredient) => {
        // Mise à jour de l'état avec le nouvel ingrédient créé
        setIngredients(prev => [...prev, created])
        setNewIngredient({ name: "", quantity: 0, unit: "g", expirationDate: "" })
        setOpen(false)
      })
      .catch(error => console.error("Erreur lors de la création de l'ingrédient:", error))
  }

  // Gérer la suppression d'un ingrédient via DELETE
  const handleDeleteIngredient = (id: string) => {
    fetch(`/api/ingredients/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la suppression")
        // Mise à jour de l'état en filtrant l'ingrédient supprimé
        setIngredients(prev => prev.filter(ingredient => ingredient.id !== id))
      })
      .catch(error => console.error("Erreur lors de la suppression de l'ingrédient:", error))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ingredients</h1>
          <p className="text-muted-foreground">Manage your pantry ingredients</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
              <DialogDescription>Add a new ingredient to your pantry</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  placeholder="Ingredient name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({ ...newIngredient, quantity: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={newIngredient.unit}
                    onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
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
                      <SelectItem value="tbsp">Tablespoon (tbsp)</SelectItem>
                      <SelectItem value="tsp">Teaspoon (tsp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={newIngredient.expirationDate}
                  onChange={(e) => setNewIngredient({ ...newIngredient, expirationDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddIngredient}>Add Ingredient</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pantry Inventory</CardTitle>
          <CardDescription>View and manage all your ingredients</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>{ingredient.quantity}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell>{ingredient.expirationDate}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(ingredient.id)}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
