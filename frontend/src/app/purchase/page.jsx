'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, ChevronLeft, ChevronRight, Search, Plus, ArrowLeft, Trash } from 'lucide-react'
import { format } from 'date-fns'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/navigation'

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL

export default function AllPurchaseTransactions() {
  const token = getCookie('accesstoken')
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState()
  const [totalPages, setTotalPages] = useState()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [metadata, setMetadata] = useState({
    next: null,
    previous: null,
    count: 0
  })

  async function fetchPaginatedData(url) {
    setLoading(true)
    try {
      const fetchUrl = url.startsWith('http') ? url : `${baseURL}${url}`
      const res = await fetch(fetchUrl, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      const data = await res.json()
      // Handle paginated response or plain list
      const list = Array.isArray(data) ? data : data.results
      setTransactions(list)
      if (Array.isArray(data)) {
        setMetadata({ next: null, previous: null, count: list.length })
        setTotalPages(1); setCurrentPage(1)
      } else {
        setMetadata({ next: data.next, previous: data.previous, count: data.count })
        setTotalPages(data.total_pages); setCurrentPage(data.page)
      }
    } catch { setError('Failed to fetch data') } finally { setLoading(false) }
  }

  const fetchInitData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}inventory/purchasetransaction/`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.results
      setTransactions(list)
      if (Array.isArray(data)) {
        setMetadata({ next: null, previous: null, count: list.length })
        setTotalPages(1); setCurrentPage(1)
      } else {
        setMetadata({ next: data.next, previous: data.previous, count: data.count })
        setTotalPages(data.total_pages); setCurrentPage(data.page)
      }
    } catch { setError('Failed to fetch initial data') } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchInitData()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}inventory/purchasetransaction/?search=${localSearchTerm}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.results
      setTransactions(list)
      if (Array.isArray(data)) {
        setMetadata({ next: null, previous: null, count: list.length })
        setTotalPages(1); setCurrentPage(1)
      } else {
        setMetadata({ next: data.next, previous: data.previous, count: data.count })
        setTotalPages(Math.ceil(data.count / 10)); setCurrentPage(1)
      }
    } catch (err) {
      setError('Failed to search transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleDateSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}inventory/purchasetransaction/?start_date=${startDate}&end_date=${endDate}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.results
      setTransactions(list)
      if (Array.isArray(data)) {
        setMetadata({ next: null, previous: null, count: list.length })
        setTotalPages(1); setCurrentPage(1)
      } else {
        setMetadata({ next: data.next, previous: data.previous, count: data.count })
        setTotalPages(Math.ceil(data.count / 10)); setCurrentPage(1)
      }
    } catch (err) {
      setError('Failed to filter transactions by date')
    } finally {
      setLoading(false)
    }
  }

  // Delete a transaction by ID
  const deleteTransaction = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}inventory/purchasetransaction/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error();
      // Refresh list
      await fetchInitData();
    } catch {
      setError('Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 text-gray-800">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-100 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="flex container h-[90vh] overflow-y-scroll bg-gray-100">
      <div className="flex-grow p-6 ">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 lg:mb-0">Purchase Transactions</h1>
          <div className="flex flex-col lg:flex-row gap-2">
            <Button
              onClick={() => router.push('/purchase/report')}
              className="w-full lg:w-auto px-5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              View Report
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full lg:w-auto px-5 text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-3 text-gray-700" />
              Back to Dashboard
            </Button>
          </div>
        </motion.div>

        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-center lg:gap-4">
          <form onSubmit={handleSearch} className="w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10 w-full lg:w-64 bg-gray-100 text-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </form>

          <form onSubmit={handleDateSearch} className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="startDate" className="text-gray-700 whitespace-nowrap">Start:</Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-100 text-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate" className="text-gray-700 whitespace-nowrap">End:</Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-100 text-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white">
              <Calendar className="w-4 h-4 mr-2 text-white" />
              Search by Date
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <Card key={`${transaction.id}-${transaction.date}`} className="bg-white border border-gray-200 shadow hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg lg:text-xl font-medium text-gray-900 flex flex-col lg:flex-row justify-between items-start lg:items-center">
                    <div>
                      <p>{transaction.vendor_name}</p>
                      <p className='text-sm text-gray-600'>Purchased by: {transaction.purchased_by_name}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 lg:mt-0">
                      <span className="text-sm lg:text-base text-gray-600">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
                      <Button variant="ghost" className="p-1 text-red-500 hover:bg-red-100" onClick={() => deleteTransaction(transaction.id)}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {transaction?.purchases.map((item, index) => (
                    <div key={`${transaction.id}-${index}`} className="mb-4 last:mb-0 p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-2">
                        <span className="text-gray-900 font-medium mb-2 lg:mb-0">{item.item_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-700">
                        <span className="text-purple-600">Quantity: {item.quantity}</span>
                        <span className="text-blue-600">Unit Price: RS. {item?.price?.toLocaleString()}</span>
                        <span className="font-bold text-green-600">Total: RS. {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 text-right text-gray-900 font-bold">
                    Total Amount: RS. {transaction?.total_amount?.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-gray-600">No transactions found.</div>
          )}
        </div>

        <div className="flex justify-center mt-6 space-x-4">
          <Button
            onClick={() => fetchPaginatedData(metadata.previous)}
            disabled={!metadata.previous}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            <ChevronLeft className="w-4 h-4 mr-2 text-gray-800" />
            Previous
          </Button>
          <span className="text-gray-700 self-center">Page {currentPage} of {totalPages}</span>
          <Button
            onClick={() => fetchPaginatedData(metadata.next)}
            disabled={!metadata.next}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2 text-gray-800" />
          </Button>
        </div>
      </div>
      <Button
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 lg:w-16 lg:h-16 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        onClick={() => router.push('/purchase/form')}
      >
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  )
}