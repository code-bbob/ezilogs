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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)
  const [pagination, setPagination] = useState({
    next: null,
    previous: null,
    count: 0,
    totalPages: 1,
    currentPage: 1
  })

  async function fetchPaginatedData(url) {
    setIsNavigating(true)
    setLoading(true)
    try {
      const fetchUrl = url.startsWith('http') ? url : `${baseURL}${url}`
      const res = await fetch(fetchUrl, { 
        headers: { Authorization: `Bearer ${token}` }, 
        credentials: 'include' 
      })
      const data = await res.json()
      
      // Handle DRF paginated response
      if (data.results) {
        setTransactions(data.results)
        setPagination({
          next: data.next,
          previous: data.previous,
          count: data.count,
          totalPages: Math.ceil(data.count / 10),
          currentPage: getCurrentPageFromUrl(url)
        })
        setCurrentPage(getCurrentPageFromUrl(url))
        setTotalPages(Math.ceil(data.count / 10))
      } else {
        // Fallback for non-paginated response
        setTransactions(Array.isArray(data) ? data : [])
        setPagination({
          next: null,
          previous: null,
          count: Array.isArray(data) ? data.length : 0,
          totalPages: 1,
          currentPage: 1
        })
        setCurrentPage(1)
        setTotalPages(1)
      }
    } catch (err) {
      setError('Failed to fetch data')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
      setIsNavigating(false)
    }
  }

  function getCurrentPageFromUrl(url) {
    if (!url) return 1
    const urlObj = new URL(url, baseURL)
    const page = urlObj.searchParams.get('page')
    return page ? parseInt(page, 10) : 1
  }

  const buildFilteredUrl = (page = 1) => {
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    if (localSearchTerm) params.append('search', localSearchTerm);
    if (startDate && endDate) {
      params.append('start_date', startDate);
      params.append('end_date', endDate);
    }
    return `inventory/purchasetransaction/${params.toString() ? `?${params.toString()}` : ''}`;
  }

  const fetchInitData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}inventory/purchasetransaction/`, { 
        headers: { Authorization: `Bearer ${token}` }, 
        credentials: 'include' 
      })
      const data = await res.json()
      
      // Handle DRF paginated response
      if (data.results) {
        setTransactions(data.results)
        setPagination({
          next: data.next,
          previous: data.previous,
          count: data.count,
          totalPages: Math.ceil(data.count / 10),
          currentPage: 1
        })
        setCurrentPage(1)
        setTotalPages(Math.ceil(data.count / 10))
      } else {
        // Fallback for non-paginated response
        setTransactions(Array.isArray(data) ? data : [])
        setPagination({
          next: null,
          previous: null,
          count: Array.isArray(data) ? data.length : 0,
          totalPages: 1,
          currentPage: 1
        })
        setCurrentPage(1)
        setTotalPages(1)
      }
    } catch (err) {
      setError('Failed to fetch initial data')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitData()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}inventory/purchasetransaction/?search=${localSearchTerm}`, { 
        headers: { Authorization: `Bearer ${token}` }, 
        credentials: 'include' 
      })
      const data = await res.json()
      
      // Handle DRF paginated response
      if (data.results) {
        setTransactions(data.results)
        setPagination({
          next: data.next,
          previous: data.previous,
          count: data.count,
          totalPages: Math.ceil(data.count / 10),
          currentPage: 1
        })
        setCurrentPage(1)
        setTotalPages(Math.ceil(data.count / 10))
      } else {
        // Fallback for non-paginated response
        setTransactions(Array.isArray(data) ? data : [])
        setPagination({
          next: null,
          previous: null,
          count: Array.isArray(data) ? data.length : 0,
          totalPages: 1,
          currentPage: 1
        })
        setCurrentPage(1)
        setTotalPages(1)
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
      const res = await fetch(`${baseURL}inventory/purchasetransaction/?start_date=${startDate}&end_date=${endDate}`, { 
        headers: { Authorization: `Bearer ${token}` }, 
        credentials: 'include' 
      })
      const data = await res.json()
      
      // Handle DRF paginated response
      if (data.results) {
        setTransactions(data.results)
        setPagination({
          next: data.next,
          previous: data.previous,
          count: data.count,
          totalPages: Math.ceil(data.count / 10),
          currentPage: 1
        })
        setCurrentPage(1)
        setTotalPages(Math.ceil(data.count / 10))
      } else {
        // Fallback for non-paginated response
        setTransactions(Array.isArray(data) ? data : [])
        setPagination({
          next: null,
          previous: null,
          count: Array.isArray(data) ? data.length : 0,
          totalPages: 1,
          currentPage: 1
        })
        setCurrentPage(1)
        setTotalPages(1)
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
      
      // Refresh current page or go to first page if current page would be empty
      const remainingItems = pagination.count - 1;
      const maxPage = Math.ceil(remainingItems / 10);
      const targetPage = currentPage > maxPage ? Math.max(1, maxPage) : currentPage;
      
      const url = buildFilteredUrl(targetPage);
      await fetchPaginatedData(url);
    } catch {
      setError('Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading purchase transactions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center h-screen overflow-y-scroll justify-center bg-gray-100 text-red-600">
        <div className="text-center">
          <div className="text-red-500 mb-2 text-2xl">⚠️</div>
          <p className="text-lg">{error}</p>
          <Button 
            onClick={() => {
              setError(null)
              fetchInitData()
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
          </Button>
        </div>
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

          {(localSearchTerm || startDate || endDate) && (
            <Button 
              onClick={() => {
                setLocalSearchTerm('')
                setStartDate('')
                setEndDate('')
                fetchInitData()
              }}
              variant="outline"
              className="w-full lg:w-auto border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Clear Filters
            </Button>
          )}
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
                        <span className="text-sm text-gray-600">Category: {item?.item_category}</span>
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
            onClick={() => fetchPaginatedData(pagination.previous)}
            disabled={!pagination.previous || isNavigating}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2 text-gray-800" />
            {isNavigating ? 'Loading...' : 'Previous'}
          </Button>
          <span className="text-gray-700 self-center">
            Page {currentPage} of {totalPages} ({pagination.count} total)
          </span>
          <Button
            onClick={() => fetchPaginatedData(pagination.next)}
            disabled={!pagination.next || isNavigating}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNavigating ? 'Loading...' : 'Next'}
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