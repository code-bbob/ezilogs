'use client';

import { getSearchProductsApi, editProductDetails, deleteProductsApi } from "@/api/GetRepairProducts";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { FaPrint } from "react-icons/fa6";

function ProductDetails() {
  const [showMore, setShowMore] = useState(false);
  const [obj, setObject] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const router = useRouter();
  const path = useParams();
  const params = path.details;

    console.log("*********", path);
    console.log("*********#######", params);

  useEffect(() => {
    if (params) {
      getRepair(params);
    }
  }, [params]);

  const getRepair = async (params) => {
    try {
      const response = await getSearchProductsApi(`q=${params}`);
      console.log("Here is searched product", response);
      if (response && response.length > 0) {
        const data = response[0];
        setObject(data);
      }
    } catch (error) {
      console.error("Error fetching repair data:", error);
    }
  };

  const primaryDetails = [
    'customer_name',
    'customer_phone_number',
    'phone_model',
    'repair_problem',
    'total_amount',
    'advance_paid',
    'due',
    'amount_paid'
  ];

  const allDetailsOrder = [
    'customer_name',
    'customer_phone_number',
    'phone_model',
    'repair_problem',
    'total_amount',
    'due',
    'amount_paid',
    'sim_tray',
    'sim',
    'SD_card',
    'phone_cover',
    'repair_id',
    'repair_description',
    'imei_number',
    'model_number',
    'phone_condition',
    'received_date',
    'received_by',
    'outside_repair',
    'delivery_date',
    'repair_status',
    'repair_cost_price',
    'cost_price_description',
    'repair_profit',
    'technician_profit',
    'my_profit',
    'admin_only_profit',
    'outside_name',
    'outside_desc',
    'taken_by',
    'outside_cost',
    'repaired_by',
    'updated_at'
  ];

  const renderDetails = (details) => (
    details.map((key) => (
      <tr key={key} className="border-b">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
          {key.replace(/_/g, ' ')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {key === 'repaired_by' 
          ? (obj['repaired_by_name'] || 'N/A') 
          : (obj[key] !== undefined && obj[key] !== null ? obj[key].toString() : 'N/A')}
      </td>
      </tr>
    ))
  );

  // Function to handle changes in the edit form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Function to save the edited details
  const handleSave = async () => {
    try {
      // Call API to update details
      const updated = await editProductDetails(editFormData);
      // For simplicity, update local state with returned updated data
      setObject(updated);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving edited details:', error);
    }
  };

  // Add delete handler function below handleSave
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this repair?')) {
      try {
        await deleteProductsApi(obj.repair_id);
        router.push('/repair');
      } catch (error) {
        console.error('Error deleting repair:', error);
      }
    }
  };

  return (
    <div className="container bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 overflow-y-scroll h-[92vh]">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-sky-700 tracking-tight">Repair Details</h1>
        <div className="flex gap-3">
          <button
            onClick={() => { setEditFormData(obj); setShowEditModal(true); }}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-800 text-white px-4 py-2 rounded-xl shadow transition duration-200"
          >
            <FaEdit size={22} /> Edit
          </button>
          <button
            onClick={() => router.push(`/search/${params}`)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-800 text-white px-4 py-2 rounded-xl shadow transition duration-200"
          >
            <FaPrint size={22} /> Print PDF
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-xl shadow transition duration-200"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Card Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6 shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Customer Info</h2>
            <div className="space-y-2">
              <div><span className="font-medium text-gray-600">Name:</span> {obj.customer_name || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">Phone:</span> {obj.customer_phone_number || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Device Info</h2>
            <div className="space-y-2">
              <div><span className="font-medium text-gray-600">Model:</span> {obj.phone_model || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">IMEI:</span> {obj.imei_number || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">Problem:</span> {obj.repair_problem || 'N/A'}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Financials</h2>
            <div className="space-y-2">
              <div><span className="font-medium text-gray-600">Total Amount:</span> ₹{obj.total_amount || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">Advance Paid:</span> ₹{obj.advance_paid || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">Due:</span> ₹{obj.due || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">Amount Paid:</span> ₹{obj.amount_paid || 'N/A'}</div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Status</h2>
            <div className="space-y-2">
              <div><span className="font-medium text-gray-600">Received Date:</span> {obj.received_date || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">Delivery Date:</span> {obj.delivery_date || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">Status:</span> <span className={`px-2 py-1 rounded text-white ${obj.repair_status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`}>{obj.repair_status || 'N/A'}</span></div>
              <div><span className="font-medium text-gray-600">Received By:</span> {obj.received_by || 'N/A'}</div>
              <div><span className="font-medium text-gray-600">Repaired By:</span> {obj.repaired_by_name || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      {obj.repair_items && obj.repair_items.length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Repair Items</h2>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-gray-600">Item Name</th>
                <th className="px-4 py-2 text-left text-gray-600">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {obj.repair_items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2">{item.item_name}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profit Section */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Profit Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><span className="font-medium text-gray-600">Repair Profit:</span> ₹{obj.repair_profit || 'N/A'}</div>
          <div><span className="font-medium text-gray-600">Technician Profit:</span> ₹{obj.technician_profit || 'N/A'}</div>
          <div><span className="font-medium text-gray-600">My Profit:</span> ₹{obj.my_profit || 'N/A'}</div>
        </div>
      </div>

      {/* Show More Section */}
      <div className="bg-white rounded-xl p-4 shadow border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">More Details</h2>
        <table className="min-w-full">
          <tbody>
            {renderDetails(primaryDetails)}
            {showMore && renderDetails(allDetailsOrder.filter(key => !primaryDetails.includes(key)))}
          </tbody>
        </table>
        <div className="flex justify-center mt-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>

      {/* Edit Modal - Inline Edit Functionality */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4">Edit Repair Details</h2>
            <form className="space-y-4">
              {allDetailsOrder.map((key) => (
                <div key={key}>
                  <label className="block text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                  <input 
                    type="text" 
                    name={key} 
                    value={editFormData[key] || ''} 
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              ))}
            </form>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-800 text-white transition duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
