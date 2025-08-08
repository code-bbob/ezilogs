"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCookie } from "cookies-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Trash2, ArrowLeft, Loader2, AlertCircle } from "lucide-react"

export default function AddPurchaseTransaction() {
  const router = useRouter()
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ""
  const token = getCookie("accesstoken")

  // State management
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    purchases: [{ item: "", price: "", quantity: "", total_price: "" }],
  })

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Dialog states
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [showNewItemDialog, setShowNewItemDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [newItemCost, setNewItemCost] = useState("")
  const [selectedCatForNewItem, setSelectedCatForNewItem] = useState("")

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [catsRes, itemsRes] = await Promise.all([
          fetch(`${baseUrl}inventory/category/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}inventory/item/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!catsRes.ok || !itemsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const cats = await catsRes.json()
        const its = await itemsRes.json()

        setCategories(cats)
        setItems(its)
        setFilteredItems(its)
      } catch (err) {
        console.error(err)
        setError("Failed to load categories or items")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [baseUrl, token])

  // Handle category change and filter items
  const handleCategoryChange = (value) => {
    setSelectedCategory(value)
    if (value && value !== "all") {
      setFilteredItems(items.filter((item) => item.category.toString() === value))
    } else {
      setFilteredItems(items)
    }
  }

  // Add new purchase row
  const handleAddRow = () => {
    setFormData((prev) => ({
      ...prev,
      purchases: [...prev.purchases, { item: "", price: "", quantity: "", total_price: "" }],
    }))
  }

  // Remove purchase row
  const handleRemoveRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      purchases: prev.purchases.filter((_, i) => i !== index),
    }))
  }

  // Handle purchase field changes
  const handlePurchaseChange = (index, field, value) => {
    const updatedPurchases = [...formData.purchases]
    updatedPurchases[index][field] = value

    // Auto-calculate total price
    if (
      (field === "quantity" || field === "price") &&
      updatedPurchases[index].quantity &&
      updatedPurchases[index].price
    ) {
      const quantity = Number.parseFloat(updatedPurchases[index].quantity)
      const price = Number.parseFloat(updatedPurchases[index].price)
      updatedPurchases[index].total_price = (price * quantity).toFixed(2)
    }

    setFormData((prev) => ({ ...prev, purchases: updatedPurchases }))
  }

  // Handle item selection and auto-fill price
  const handleItemChange = (index, value) => {
    const selectedItem = items.find((item) => item.id.toString() === value)
    handlePurchaseChange(index, "item", value)
    if (selectedItem?.cost) {
      handlePurchaseChange(index, "price", selectedItem.cost.toString())
    }
  }

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const payload = {
        ...formData,
        purchases: formData.purchases.map((purchase) => ({
          item: purchase.item,
          price: Number.parseFloat(purchase.price),
          quantity: Number.parseInt(purchase.quantity, 10),
        })),
      }

      const response = await fetch(`${baseUrl}inventory/purchasetransaction/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to submit transaction")
      }

      router.push("/inventory")
    } catch (err) {
      console.error(err)
      setError("Failed to submit transaction. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const response = await fetch(`${baseUrl}inventory/category/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to add category")
      }

      const newCategory = await response.json()
      setCategories((prev) => [...prev, newCategory])
      setNewCategoryName("")
      setShowNewCategoryDialog(false)
    } catch (err) {
      console.error(err)
      setError("Failed to add category")
    }
  }

  // Add new item
  const handleAddItem = async () => {
    try {
      const res = await fetch(`${baseUrl}inventory/item/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newItemName,
          category: selectedCatForNewItem,
          cost: Number.parseFloat(newItemCost),
        }),
      })
      const it = await res.json()
      setItems((prev) => [...prev, it])
      setFilteredItems((prev) => [...prev, it])
      setNewItemName("")
      setNewItemCost("")
      setSelectedCatForNewItem("")
      setShowNewItemDialog(false)
    } catch (e) {
      console.error(e)
      setError("Failed to add item")
    }
  }

  // Calculate total amount
  const totalAmount = formData.purchases.reduce((sum, purchase) => {
    return sum + (Number.parseFloat(purchase.total_price) || 0)
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex bg-white text-gray-900">
      <div className="flex-grow p-6 h-[90vh] overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => router.push("/inventory")} variant="outline" className="mb-6 px-4 py-2 text-gray-800 border-gray-300 hover:bg-gray-100">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Add Purchase Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date and Category Selection */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2">Transaction Date</Label>
                    <Input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Filter by Category</Label>
                    <div className="flex space-x-2">
                      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCategoryDialog(true)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Purchases Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Purchase Items</h3>
                    <Badge variant="secondary">Total: ${totalAmount.toFixed(2)}</Badge>
                  </div>

                  {formData.purchases.map((purchase, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          {index > 0 && (
                            <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveRow(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                          <div className="space-y-2">
                            <Label>Item</Label>
                            <div className="flex space-x-2">
                              <Select value={purchase.item} onValueChange={(value) => handleItemChange(index, value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setShowNewItemDialog(true)}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={purchase.quantity}
                              onChange={(e) => handlePurchaseChange(index, "quantity", e.target.value)}
                              placeholder="0"
                              className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={purchase.price}
                              onChange={(e) => handlePurchaseChange(index, "price", e.target.value)}
                              placeholder="0.00"
                              className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Total Price</Label>
                            <Input type="number" value={purchase.total_price} readOnly className="bg-muted" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button type="button" variant="outline" onClick={handleAddRow} className="w-full bg-transparent">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Another Item
                  </Button>
                </div>

                <Separator />

                {/* Submit Button */}
                <Button type="submit" disabled={submitting} className="w-full" size="lg">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Transaction"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* New Category Dialog */}
          <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>Enter the name of the new category you want to create.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  Add Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Item Dialog */}
          <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
            <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>Enter details for the new item.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Item name"
                  className="bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
                <Input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  placeholder="Cost"
                  className="bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
                <Select onValueChange={setSelectedCatForNewItem} value={selectedCatForNewItem}>
                  <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()} className="text-gray-900">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddItem}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
