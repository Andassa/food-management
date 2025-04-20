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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Trash } from "lucide-react"
import { useEffect, useState } from "react"

//
// Types utilisés côté front-end
//
type Recipe = {
  id: string  // Conversion en string pour la correspondance
  name: string
}

type MealType = "breakfast" | "lunch" | "dinner"

type MealPlan = {
  id: string
  day: string
  mealType: MealType
  recipeId: string
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const mealTypes: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
]

//
// État initial pour la création d’un nouveau repas
//
const initialNewMeal: Omit<MealPlan, "id"> = {
  day: "Monday",
  mealType: "breakfast",
  recipeId: "",
}

export default function MealPlanningPage() {
  // State pour les plans de repas
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([])
  // State pour les recettes (chargées dynamiquement)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  // State pour le nouveau repas en cours de création
  const [newMeal, setNewMeal] = useState<Omit<MealPlan, "id">>(initialNewMeal)
  // État pour contrôler l'ouverture de la dialog
  const [open, setOpen] = useState(false)

  // Chargement dynamique des recettes depuis l'API
  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur de chargement")
        return res.json()
      })
      .then((data: Recipe[]) => {
        // Convertir l'id en string
        const recipesWithStringId = data.map((r) => ({
          ...r,
          id: r.id.toString(),
        }))
        setRecipes(recipesWithStringId)
      })
      .catch((error) => console.error(error))
  }, [])

  // Charger la liste des plans de repas depuis le backend
  useEffect(() => {
    fetch("/api/mealplans")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des plans de repas")
        return res.json()
      })
      .then((data: any[]) => {
        // Transformation du format backend (date au format "Monday_breakfast")
        // vers le format front-end { day, mealType }
        const plans: MealPlan[] = data.map((item) => {
          const [day, mealType] = item.date.split("_")
          return {
            id: item.id.toString(),
            day,
            mealType: mealType as MealType,
            recipeId: item.recipeId.toString(),
          }
        })
        setMealPlan(plans)
      })
      .catch((error) => console.error("Erreur lors du chargement :", error))
  }, [])

  // Ajout ou mise à jour d’un repas dans le planning
  const handleAddMeal = () => {
    if (!newMeal.recipeId) return

    // Préparer l'objet payload attendu par le backend :
    // On concatène day et mealType dans le champ "date".
    const payload = {
      date: `${newMeal.day}_${newMeal.mealType}`,
      recipeId: parseInt(newMeal.recipeId),
    }

    // Vérifier si un repas existe déjà pour ce jour et ce type
    const existingMeal = mealPlan.find(
      (meal) => meal.day === newMeal.day && meal.mealType === newMeal.mealType,
    )

    if (existingMeal) {
      // Mise à jour du repas existant via une requête PUT
      fetch(`/api/mealplans/${existingMeal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la mise à jour du plan de repas")
          return res.json()
        })
        .then((updated: any) => {
          const [day, mealType] = updated.date.split("_")
          const updatedMeal: MealPlan = {
            id: updated.id.toString(),
            day,
            mealType: mealType as MealType,
            // Conversion forcée en string
            recipeId: String(updated.recipeId ?? ""),
          }
          setMealPlan((prev) =>
            prev.map((meal) => (meal.id === updatedMeal.id ? updatedMeal : meal)),
          )
          setNewMeal(initialNewMeal)
          setOpen(false)
        })
        .catch((err) => console.error(err))
    } else {
      // Création d’un nouveau plan de repas via une requête POST
      fetch("/api/mealplans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la création du plan de repas")
          return res.json()
        })
        .then((created: any) => {
          const [day, mealType] = created.date.split("_")
          const newPlan: MealPlan = {
            id: created.id.toString(),
            day,
            mealType: mealType as MealType,
            // Conversion forcée en string
            recipeId: String(created.recipeId ?? ""),
          }
          setMealPlan((prev) => [...prev, newPlan])
          setNewMeal(initialNewMeal)
          setOpen(false)
        })
        .catch((err) => console.error(err))
    }
  }

  // Suppression d’un repas du planning
  const handleDeleteMeal = (id: string) => {
    fetch(`/api/mealplans/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la suppression du plan de repas")
        setMealPlan((prev) => prev.filter((meal) => meal.id !== id))
      })
      .catch((err) => console.error(err))
  }

  // Récupère le nom d'une recette grâce à son identifiant
  const getRecipeName = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId)
    return recipe ? recipe.name : "Unknown Recipe"
  }

  // Renvoie le repas correspondant pour un jour et un type donné
  const getMealForDayAndType = (day: string, mealType: MealType) => {
    return mealPlan.find((meal) => meal.day === day && meal.mealType === mealType)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Planning</h1>
          <p className="text-muted-foreground">Plan your meals for the week</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meal to Plan</DialogTitle>
              <DialogDescription>Select a day, meal type, and recipe</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="day">Day</label>
                <Select
                  value={newMeal.day}
                  onValueChange={(value) => setNewMeal({ ...newMeal, day: value })}
                >
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="mealType">Meal Type</label>
                <Select
                  value={newMeal.mealType}
                  onValueChange={(value) =>
                    setNewMeal({ ...newMeal, mealType: value as MealType })
                  }
                >
                  <SelectTrigger id="mealType">
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="recipe">Recipe</label>
                <Select
                  value={newMeal.recipeId}
                  onValueChange={(value) =>
                    setNewMeal({ ...newMeal, recipeId: value })
                  }
                >
                  <SelectTrigger id="recipe">
                    <SelectValue placeholder="Select recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMeal}>Add to Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Affichage du plan de repas hebdomadaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Weekly Meal Plan
          </CardTitle>
          <CardDescription>Your meal plan for the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {/* Lignes d'en-tête pour les jours de la semaine */}
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center font-medium">
                {day}
              </div>
            ))}
            {/* Pour chaque jour et chaque type de repas */}
            {daysOfWeek.map((day) => (
              <div key={`${day}-breakfast`} className="flex flex-col items-center">
                <div className="mb-1 text-xs text-muted-foreground">Breakfast</div>
                {getMealForDayAndType(day, "breakfast") ? (
                  <div className="relative w-full rounded-md border bg-muted/50 p-2 text-center text-xs">
                    {getRecipeName(getMealForDayAndType(day, "breakfast")!.recipeId)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-background"
                      onClick={() =>
                        handleDeleteMeal(getMealForDayAndType(day, "breakfast")!.id)
                      }
                    >
                      <Trash className="h-3 w-3" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex h-8 w-full cursor-pointer items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground hover:bg-muted/50"
                    onClick={() => {
                      setNewMeal({ day, mealType: "breakfast", recipeId: "" })
                      setOpen(true)
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </div>
                )}
              </div>
            ))}
            {daysOfWeek.map((day) => (
              <div key={`${day}-lunch`} className="flex flex-col items-center">
                <div className="mb-1 text-xs text-muted-foreground">Lunch</div>
                {getMealForDayAndType(day, "lunch") ? (
                  <div className="relative w-full rounded-md border bg-muted/50 p-2 text-center text-xs">
                    {getRecipeName(getMealForDayAndType(day, "lunch")!.recipeId)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-background"
                      onClick={() =>
                        handleDeleteMeal(getMealForDayAndType(day, "lunch")!.id)
                      }
                    >
                      <Trash className="h-3 w-3" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex h-8 w-full cursor-pointer items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground hover:bg-muted/50"
                    onClick={() => {
                      setNewMeal({ day, mealType: "lunch", recipeId: "" })
                      setOpen(true)
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </div>
                )}
              </div>
            ))}
            {daysOfWeek.map((day) => (
              <div key={`${day}-dinner`} className="flex flex-col items-center">
                <div className="mb-1 text-xs text-muted-foreground">Dinner</div>
                {getMealForDayAndType(day, "dinner") ? (
                  <div className="relative w-full rounded-md border bg-muted/50 p-2 text-center text-xs">
                    {getRecipeName(getMealForDayAndType(day, "dinner")!.recipeId)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-background"
                      onClick={() =>
                        handleDeleteMeal(getMealForDayAndType(day, "dinner")!.id)
                      }
                    >
                      <Trash className="h-3 w-3" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex h-8 w-full cursor-pointer items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground hover:bg-muted/50"
                    onClick={() => {
                      setNewMeal({ day, mealType: "dinner", recipeId: "" })
                      setOpen(true)
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
