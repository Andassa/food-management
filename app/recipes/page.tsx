"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Edit, Plus, Trash } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type Recipe = {
  id: string
  name: string
  description?: string
  ingredients: string[]
  steps: string[]
  prepTime: number
  cookTime: number
}

// Hook personnalisé pour rafraîchir lors du focus de la page
function usePageFocus(callback: () => void) {
  useEffect(() => {
    window.addEventListener("focus", callback)
    return () => {
      window.removeEventListener("focus", callback)
    }
  }, [callback])
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newRecipe, setNewRecipe] = useState<Omit<Recipe, "id">>({
    name: "",
    description: "",
    ingredients: [""],
    steps: [""],
    prepTime: 0,
    cookTime: 0,
  })

  // Fonction pour charger les recettes depuis le backend
  const loadRecipes = useCallback(() => {
    fetch("/api/recipes")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement")
        return res.json()
      })
      .then((data: Recipe[]) => setRecipes(data))
      .catch((error) => console.error("Erreur lors du chargement des recettes :", error))
  }, [])

  // Chargement initial lors du montage du composant
  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  // Recharge des recettes à chaque fois que la fenêtre reprend le focus
  usePageFocus(loadRecipes)

  // Créer une nouvelle recette en effectuant un POST vers le backend
  const handleAddRecipe = () => {
    if (newRecipe.name.trim() === "") return

    // Filtrer les champs vides
    const ingredients = newRecipe.ingredients.filter((i) => i.trim() !== "")
    const steps = newRecipe.steps.filter((s) => s.trim() !== "")
    if (ingredients.length === 0 || steps.length === 0) return

    const recipeToCreate = {
      ...newRecipe,
      ingredients,
      steps,
    }

    fetch("/api/recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipeToCreate),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur à la création")
        return res.json()
      })
      .then((created: Recipe) => {
        // Option : tu peux aussi recharger l'ensemble des recettes après création
        setRecipes([...recipes, created])
        setNewRecipe({
          name: "",
          description: "",
          ingredients: [""],
          steps: [""],
          prepTime: 0,
          cookTime: 0,
        })
      })
      .catch((error) => console.error("Erreur lors de la création de la recette :", error))
  }

  // Mettre à jour une recette via PUT sur le backend
  const handleUpdateRecipe = () => {
    if (!selectedRecipe) return

    const ingredients = selectedRecipe.ingredients.filter((i) => i.trim() !== "")
    const steps = selectedRecipe.steps.filter((s) => s.trim() !== "")
    if (ingredients.length === 0 || steps.length === 0) return

    const recipeToUpdate = {
      ...selectedRecipe,
      ingredients,
      steps,
    }

    fetch(`/api/recipes/${selectedRecipe.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(recipeToUpdate),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la mise à jour")
        return res.json()
      })
      .then((updated: Recipe) => {
        setRecipes(recipes.map((recipe) => (recipe.id === updated.id ? updated : recipe)))
        setSelectedRecipe(null)
        setIsEditing(false)
      })
      .catch((error) => console.error("Erreur lors de la mise à jour de la recette :", error))
  }

  // Supprimer une recette en appelant le backend
  const handleDeleteRecipe = (id: string) => {
    fetch(`/api/recipes/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la suppression")
        setRecipes(recipes.filter((recipe) => recipe.id !== id))
      })
      .catch((error) => console.error("Erreur lors de la suppression de la recette :", error))
  }

  const addIngredientField = () => {
    if (isEditing && selectedRecipe) {
      setSelectedRecipe({
        ...selectedRecipe,
        ingredients: [...selectedRecipe.ingredients, ""],
      })
    } else {
      setNewRecipe({
        ...newRecipe,
        ingredients: [...newRecipe.ingredients, ""],
      })
    }
  }

  const addStepField = () => {
    if (isEditing && selectedRecipe) {
      setSelectedRecipe({
        ...selectedRecipe,
        steps: [...selectedRecipe.steps, ""],
      })
    } else {
      setNewRecipe({
        ...newRecipe,
        steps: [...newRecipe.steps, ""],
      })
    }
  }

  const updateIngredient = (index: number, value: string) => {
    if (isEditing && selectedRecipe) {
      const updatedIngredients = [...selectedRecipe.ingredients]
      updatedIngredients[index] = value
      setSelectedRecipe({
        ...selectedRecipe,
        ingredients: updatedIngredients,
      })
    } else {
      const updatedIngredients = [...newRecipe.ingredients]
      updatedIngredients[index] = value
      setNewRecipe({
        ...newRecipe,
        ingredients: updatedIngredients,
      })
    }
  }

  const updateStep = (index: number, value: string) => {
    if (isEditing && selectedRecipe) {
      const updatedSteps = [...selectedRecipe.steps]
      updatedSteps[index] = value
      setSelectedRecipe({
        ...selectedRecipe,
        steps: updatedSteps,
      })
    } else {
      const updatedSteps = [...newRecipe.steps]
      updatedSteps[index] = value
      setNewRecipe({
        ...newRecipe,
        steps: updatedSteps,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">Manage your recipe collection</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Recipe</DialogTitle>
              <DialogDescription>Create a new recipe with ingredients and preparation steps</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Recipe Name</Label>
                <Input
                  id="name"
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                  placeholder="Recipe name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newRecipe.description}
                  onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                  placeholder="Recipe description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={newRecipe.prepTime}
                    onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cookTime">Cook Time (minutes)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    value={newRecipe.cookTime}
                    onChange={(e) => setNewRecipe({ ...newRecipe, cookTime: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>
              <Tabs defaultValue="ingredients">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                  <TabsTrigger value="steps">Preparation Steps</TabsTrigger>
                </TabsList>
                <TabsContent value="ingredients" className="space-y-4">
                  {newRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        placeholder={`Ingredient ${index + 1}`}
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addIngredientField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Ingredient
                  </Button>
                </TabsContent>
                <TabsContent value="steps" className="space-y-4">
                  {newRecipe.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Textarea
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addStepField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Step
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button onClick={handleAddRecipe}>Save Recipe</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{recipe.name}</span>
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Prep: {recipe.prepTime} min | Cook: {recipe.cookTime} min
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-medium">Ingredients:</h3>
                <ul className="list-disc pl-5 text-sm">
                  {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <li className="text-muted-foreground">+{recipe.ingredients.length - 3} more</li>
                  )}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRecipe(recipe)
                      setIsEditing(true)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Edit Recipe</DialogTitle>
                  </DialogHeader>
                  {selectedRecipe && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-name">Recipe Name</Label>
                        <Input
                          id="edit-name"
                          value={selectedRecipe.name}
                          onChange={(e) => setSelectedRecipe({ ...selectedRecipe, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Input
                          id="edit-description"
                          value={selectedRecipe.description || ""}
                          onChange={(e) =>
                            setSelectedRecipe({ ...selectedRecipe, description: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-prepTime">Prep Time (minutes)</Label>
                          <Input
                            id="edit-prepTime"
                            type="number"
                            value={selectedRecipe.prepTime}
                            onChange={(e) =>
                              setSelectedRecipe({ ...selectedRecipe, prepTime: Number(e.target.value) })
                            }
                            min={0}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-cookTime">Cook Time (minutes)</Label>
                          <Input
                            id="edit-cookTime"
                            type="number"
                            value={selectedRecipe.cookTime}
                            onChange={(e) =>
                              setSelectedRecipe({ ...selectedRecipe, cookTime: Number(e.target.value) })
                            }
                            min={0}
                          />
                        </div>
                      </div>
                      <Tabs defaultValue="ingredients">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                          <TabsTrigger value="steps">Preparation Steps</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ingredients" className="space-y-4">
                          {selectedRecipe.ingredients.map((ingredient, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={ingredient}
                                onChange={(e) => updateIngredient(index, e.target.value)}
                              />
                            </div>
                          ))}
                          <Button type="button" variant="outline" onClick={addIngredientField}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Ingredient
                          </Button>
                        </TabsContent>
                        <TabsContent value="steps" className="space-y-4">
                          {selectedRecipe.steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Textarea
                                value={step}
                                onChange={(e) => updateStep(index, e.target.value)}
                              />
                            </div>
                          ))}
                          <Button type="button" variant="outline" onClick={addStepField}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Step
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedRecipe(null)
                        setIsEditing(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateRecipe}>Update Recipe</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteRecipe(recipe.id)}>
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
