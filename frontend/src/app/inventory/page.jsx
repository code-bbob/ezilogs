  "use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus, Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteCategory, getCategories, postCategory } from "@/api/GetRepairProducts"

export default function InventoryPageComponent() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [isRefetch, setIsRefetch] = useState(false)
  const [newCatName, setNewCatName] = useState("")

  useEffect(() => {
    async function fetchCategory() {
      setLoading(true)
      setError(null)
      try {
        const response = await getCategories()
        console.log("response categories", response)
        setCategories(response)
        setFilteredCategories(response)
        setLoading(false)
        setIsRefetch(false)
      } catch (err) {
        console.error("Error fetching categories:", err)
        setError("Failed to load categories")
        setLoading(false)
      }
    }
    fetchCategory()
  }, [isRefetch])

  useEffect(() => {
    const results = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredCategories(results)
  }, [searchTerm, categories])

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    try {
      const response = await postCategory({ name: newCatName })
      console.log("New Category Added:", response)
      setCategories([...categories, response])
      setFilteredCategories([...filteredCategories, response])
      setNewCatName("")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-10 w-10 text-sky-600" />
      </div>
    )

  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    )

  function handleRouting(e, id) {
    if (e.target.closest("button")) {
      return // Don't navigate
    }
    router.push(`/inventory/category/${id}`)
  }

  return (
    <div className="container h-[90vh] overflow-y-scroll mx-auto px-6 py-8 bg-gray-50 text-gray-700 ">
      <div className="flex">

      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Inventory Categories
      </h1>

      <div className="flex items-center bg-white border border-gray-200 rounded-lg px-4 py-3 w-full max-w-md mx-auto mb-6">
        <Search className="mr-2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={handleSearch}
          className="flex-1 border-none outline-none bg-transparent placeholder-gray-400 text-gray-700"
        />
      </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories?.map((data) => (
          <div key={data.id} className="justify-self-center w-full">
            <CategoryCard category={data} onClick={(e) => handleRouting(e, data.id)} setIsRefetch={setIsRefetch} />
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No categories found.
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="fixed bottom-8 right-8 bg-sky-600 text-white p-4 rounded-full shadow-lg hover:bg-sky-700 transition-transform transform hover:scale-110"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md w-full bg-white text-gray-800 rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Add New Category
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Enter the name of the new category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <Label htmlFor="newCatName" className=" text-gray-700">
                Category Name
              </Label>
              <input
                id="newCatName"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Enter category name"
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCategory} className="mt-2 w-full bg-sky-600 hover:bg-sky-700 text-white">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryCard({ category, onClick, setIsRefetch }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const handleDelete = async (id) => {
    try {
      const response = await deleteCategory(id)
      console.log("deleted", response)
      setIsAlertOpen(false)
      setIsRefetch(true)
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  return (
    <div onClick={onClick} className="cursor-pointer">
      <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 hover:shadow-lg transition-all">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-800 capitalize truncate">
            {category.name}
          </span>
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
              <button className="p-1 rounded" onClick={(e) => e.stopPropagation()}>
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-800 hover:scale-125" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[90vw] sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this data and remove this data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(category.id)}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
