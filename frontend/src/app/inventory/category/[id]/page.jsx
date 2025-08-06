'use client';
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone, ArrowLeft, Search, Plus, Trash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getItems, postItem, getCategories, deleteItem } from '@/api/GetRepairProducts';

export default function InventoryPageComponent() {
    const router = useRouter()
    const params = useParams()
    const id = params.id
  const [filteredItems, setFilteredItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('')
  const [newItemCost, setNewItemCost] = useState('')

  // Toggle select all items
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filteredItems.map(i => i.id));
    } else {
      setSelectedItems([]);
    }
  };
  // Toggle individual item selection
  const toggleSelectItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  // Delete all selected items
  const deleteSelected = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Delete ${selectedItems.length} items?`)) return;
    for (const itemId of selectedItems) {
      try { await deleteItem(itemId); } catch(err) { console.error(`Failed deleting ${itemId}`, err); }
    }
    setFilteredItems(prev => prev.filter(i => !selectedItems.includes(i.id)));
    setSelectedItems([]);
  };

  useEffect(() => {
    setLoading(true)
    setError(null)
    async function fetchData() {
      try {
        const itemsData = await getItems(id)
        setFilteredItems(itemsData)
        const categories = await getCategories()
        const current = categories.find(cat => cat.id === parseInt(id))
        setCategoryName(current?.name || '')
      }
      catch (err) { 
        console.error('Error fetching data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  console.log("items", filteredItems)

  if (loading) return (
    <div className="flex items-center justify-center text-black">
      Loading...
    </div>
  )
  
  if (error) return (
    <div className="flex items-center justify-center from-slate-900 to-slate-800 text-red-500">
      {error}
    </div>
  )

  return (
      <div className="p-3 bg-inherit text-black overflow-y-scroll h-[90%]">
        <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button
            disabled={selectedItems.length === 0}
            onClick={deleteSelected}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete Selected ({selectedItems.length})
          </Button>
        </div>
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (Rs.)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock (Rs.)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(item.quantity * item.cost).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={async () => {
                          if (confirm(`Delete item '${item.name}'?`)) {
                            try {
                              await deleteItem(item.id)
                              setFilteredItems(prev => prev.filter(i => i.id !== item.id))
                            } catch (err) {
                              console.error('Delete failed', err)
                            }
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete item"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div
              className="text-center text-black mt-8"
            >
              No Items found matching your search.
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-8 right-8 rounded-full w-14 h-14 lg:w-16 lg:h-16 shadow-lg bg-sky-600 hover:bg-sky-700 text-black"
            >
              <Plus className="w-6 h-6 lg:w-8 lg:h-8" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter the details of the new item you want to add.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newItemName" className="text-right">
                  Item Name
                </Label>
                <Input
                  id="newItemName"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="col-span-3 bg-slate-700 text-white"
                  placeholder="Name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newItemQuantity" className="text-right">Quantity</Label>
                <Input
                  id="newItemQuantity"
                  type="number"
                  value={newItemQuantity}
                  onChange={e => setNewItemQuantity(e.target.value)}
                  className="col-span-3 bg-slate-700 text-white"
                  placeholder="Quantity"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newItemCost" className="text-right">Cost</Label>
                <Input
                  id="newItemCost"
                  type="number"
                  value={newItemCost}
                  onChange={e => setNewItemCost(e.target.value)}
                  className="col-span-3 bg-slate-700 text-white"
                  placeholder="Cost"
                />
              </div>
             </div>
             <DialogFooter>
              <Button type="button" onClick={async () => {
                  const data = { name: newItemName, quantity: newItemQuantity, cost: newItemCost, category: id };
                  const created = await postItem(data);
                  setFilteredItems([...filteredItems, created]);
                  setIsDialogOpen(false);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-black">
                Add Item
              </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>  
  )
}

function BrandCard({ brand, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="bg-gradient-to-r to-sky-700 from-slate-800 border-none shadow-lg hover:shadow-xl transition-shadow duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        <div className="absolute inset-0 bg-sky-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-lg sm:text-xl font-medium text-slate-300  transition-colors duration-300">
            {brand.name}
          </CardTitle>
          <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-xs sm:text-sm text-slate-400 group-hover:text-purple-200 transition-colors duration-300">
            Items in stock: {brand.quantity}
          </div>
          <div className="text-xs sm:text-sm text-blue-400 mt-1 group-hover:text-purple-200 transition-colors duration-300">
          RS. {brand.cost}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}