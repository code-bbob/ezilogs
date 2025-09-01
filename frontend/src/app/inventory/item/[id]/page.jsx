'use client';
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getItemUsage } from '@/api/GetRepairProducts'

export default function ItemUsageReportPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    let ignore = false
  async function run() {
      try {
        setLoading(true)
    const res = await getItemUsage(id, { startDate, endDate })
        if (!ignore) setData(res)
      } catch (e) {
        if (!ignore) setError('Failed to load report')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
  if (id) run()
  return () => { ignore = true }
  }, [id, startDate, endDate])

  const summary = data?.summary || { total_usages: 0, total_quantity: 0 }
  const item = data?.item

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Item Usage Report</h1>
          <p className="text-gray-500 text-sm">See repairs and dates this item was used</p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-xs text-gray-600">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <button
            onClick={() => { /* triggers useEffect */ }}
            className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white"
          >
            Apply
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate('') }}
              className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Clear
            </button>
          )}
          <button onClick={() => router.back()} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Back</button>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Item</div>
            <div className="text-lg font-medium">{item?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Category</div>
            <div className="text-lg font-medium">{item?.category_name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Quantity Used</div>
            <div className="text-lg font-semibold">{summary.total_quantity}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repair ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.usage || []).map((u, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-700">{(u.used_date || u.received_date || '').toString().slice(0,10)}</td>
                <td className="px-6 py-3 text-sm text-blue-600">{u.repair_id}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{u.customer_name}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{u.customer_phone_number}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{u.phone_model}</td>
                <td className="px-6 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-white ${u.repair_status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}>{u.repair_status}</span>
                </td>
                <td className="px-6 py-3 text-sm font-semibold">{u.quantity}</td>
                <td className="px-6 py-3 text-sm">
                  <button onClick={() => router.push(`/repair/productDetails/${u.repair_id}`)} className="text-sky-600 hover:text-sky-800">View</button>
                </td>
              </tr>
            ))}
            {(!data?.usage || data.usage.length === 0) && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No usage records found for this item.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
