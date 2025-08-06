'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Download, Printer, Filter, ArrowLeft, Search } from 'lucide-react'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/navigation'

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL

export default function PurchaseReport() {
  const token = getCookie('accesstoken')
  const router = useRouter()
  const [purchases, setPurchases] = useState([])
  const [filteredPurchases, setFilteredPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [totals, setTotals] = useState({
    subtotalSales: 0,
    totalDiscount: 0,
    totalSales: 0,
    totalSalesCount: 0,
    totalProfit: 0,
    cashSales: 0
  })

  const fetchPurchases = async (filters = {}) => {
    setLoading(true)
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (filters.startDate && filters.endDate) {
        params.append('start_date', filters.startDate)
        params.append('end_date', filters.endDate)
      }
      if (filters.searchTerm) {
        params.append('search', filters.searchTerm)
      }
      
      const queryString = params.toString()
      const url = `${baseURL}inventory/purchase-report/${queryString ? `?${queryString}` : ''}`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      })
      const data = await res.json()
      
      setPurchases(data.purchases)
      setFilteredPurchases(data.purchases)
      
      // Update totals from backend summary
      if (data.summary) {
        setTotals({
          subtotalSales: data.summary.total_amount,
          totalDiscount: 0,
          totalSales: data.summary.total_amount,
          totalSalesCount: data.summary.total_purchases,
          totalProfit: 0,
          cashSales: data.summary.total_amount
        })
      }
    } catch (err) {
      setError('Failed to fetch purchase data')
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = () => {
    // Trigger a new fetch with current filter values
    fetchPurchases({
      startDate,
      endDate,
      searchTerm
    })
  }

  const handleSearch = () => {
    // Trigger search with current search terms
    fetchPurchases({
      startDate,
      endDate,
      searchTerm
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create CSV content
    const headers = ['Date', 'Item Name', 'Category', 'Method', 'Unit Price', 'Quantity', 'Total']
    const csvContent = [
      headers.join(','),
      ...filteredPurchases.map(purchase => [
        purchase.transaction_date,
        purchase.item_name,
        purchase.item_category || 'N/A',
        'Purchase',
        purchase.price,
        purchase.quantity,
        purchase.total_cost
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `purchase-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  useEffect(() => {
    fetchPurchases()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-red-600">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 print:bg-white print:text-black print:p-4">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
          .bg-gray-50 { background: white !important; }
          .bg-white { background: white !important; border: 1px solid #ccc !important; }
          .text-gray-900 { color: black !important; }
          .text-gray-700 { color: black !important; }
          .text-gray-600 { color: #666 !important; }
          .border-gray-200 { border-color: #ccc !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          td { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-gray-900">Purchase Report</h1>
            <p className="text-gray-600">{new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <Button
            onClick={() => router.push('/purchase')}
            variant="outline"
            className="mt-4 lg:mt-0 border-gray-300 text-gray-700 hover:bg-gray-100 no-print"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchases
          </Button>
        </motion.div>

        {/* Filters */}
        <Card className="bg-white border-gray-200 mb-6 shadow-sm no-print">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Label htmlFor="startDate" className="text-gray-700 mb-2 block font-medium">Name:</Label>

                <Search className="absolute left-3 top-2/3 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search items, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="startDate" className="text-gray-700 mb-2 block font-medium">Start Date:</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-gray-700 mb-2 block font-medium">End Date:</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button 
                onClick={handleDateFilter}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter by Date
              </Button>
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setStartDate('')
                  setEndDate('')
                  fetchPurchases()
                }}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm"
              >
                Clear Filters
              </Button>
              <Button 
                onClick={handlePrint}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 shadow-sm"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button 
                onClick={handleDownload}
                variant="outline"
                className="border-green-300 text-green-600 hover:bg-green-50 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white border-gray-200 mb-6 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-700 font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-gray-700 font-semibold">Item Name</th>
                    <th className="px-6 py-4 text-left text-gray-700 font-semibold">Category</th>
                    <th className="px-6 py-4 text-left text-gray-700 font-semibold">Method</th>
                    <th className="px-6 py-4 text-right text-gray-700 font-semibold">Unit Price</th>
                    <th className="px-6 py-4 text-right text-gray-700 font-semibold">Quantity</th>
                    <th className="px-6 py-4 text-right text-gray-700 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length > 0 ? (
                    filteredPurchases.map((purchase, index) => (
                      <tr key={`${purchase.id}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900">
                          {new Date(purchase.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{purchase.item_name}</td>
                        <td className="px-6 py-4 text-gray-700">{purchase.item_category || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-700">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Purchase
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-medium">NPR {purchase.price?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-gray-700">{purchase.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-900 font-semibold">NPR {purchase.total_cost?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="text-gray-400 mb-2">📋</div>
                          <p>No purchases found for the selected criteria.</p>
                          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search terms.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className=" gap-6">
              {/* <div className="text-right">
                <p className="text-gray-600 text-sm font-medium mb-1">Subtotal Purchases:</p>
                <p className="text-xl font-bold text-gray-900">NPR {totals.subtotalSales.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm font-medium mb-1">Total Discount:</p>
                <p className="text-xl font-bold text-gray-900">NPR {totals.totalDiscount.toLocaleString()}</p>
              </div> */}
              <div className="text-right">
                <p className="text-gray-600 text-sm font-medium mb-1">Total Purchases:</p>
                <p className="text-xl font-bold text-blue-600">NPR {totals.totalSales.toLocaleString()}</p>
              </div>
              {/* <div className="text-right">
                <p className="text-gray-600 text-sm font-medium mb-1">Purchase Count:</p>
                <p className="text-xl font-bold text-gray-900">{totals.totalSalesCount}</p>
              </div> */}
              {/* <div className="text-right">
                <p className="text-gray-600 text-sm font-medium mb-1">Total Profit:</p>
                <p className="text-xl font-bold text-green-600">NPR {totals.totalProfit.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm font-bold mb-1">Cash Purchases:</p>
                <p className="text-xl font-bold text-purple-600">NPR {totals.cashSales.toLocaleString()}</p>
              </div> */}
            </div>
            <div className="mt-8 text-center text-gray-500 text-sm border-t border-gray-200 pt-4">
              This report is auto-generated and does not require a signature.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
