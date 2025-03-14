import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/axios';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/api/orders/${id}`);
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch order details');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await api.put(`/api/orders/${id}/status`, {
        status: newStatus
      });
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="text-red-700">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <div className="text-yellow-700">Order not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">
              Order #{order.orderNumber}
            </h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold
                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              {(user.role === 'admin' || user.role === 'staff') && (
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Created on {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Order Details */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {order.customer?.name}</p>
                <p><span className="font-medium">Email:</span> {order.customer?.email}</p>
              </div>
            </div>

            {/* Shipping Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
              <div className="space-y-2">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Service:</span> {order.DeliveryService?.name}</p>
                <p><span className="font-medium">City:</span> {order.deliveryCity?.name}</p>
                <p><span className="font-medium">Fee:</span> ${parseFloat(order.deliveryFee).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.OrderItems?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.Product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {item.Product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        ${parseFloat(item.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-8 border-t pt-6">
            <div className="w-full md:w-96 ml-auto bg-gray-50 rounded-lg p-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee:</span>
                <span>${parseFloat(order.deliveryFee).toFixed(2)}</span>
              </div>
              {order.salesmanCommission > 0 && (user.role === 'admin' || user.role === 'staff' || user.role === 'salesman') && (
                <div className="flex justify-between text-green-600">
                  <span>Salesman Commission (10%):</span>
                  <span>${parseFloat(order.salesmanCommission).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                <span>Total:</span>
                <span>${(parseFloat(order.totalAmount) + parseFloat(order.deliveryFee)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Salesman Information */}
          {(user.role === 'admin' || user.role === 'staff') && order.salesman && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Salesman Information</h2>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {order.salesman.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {order.salesman.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {order.salesman.phone}
                </p>
                {order.salesman.staff && (
                  <p>
                    <span className="font-medium">Staff Manager:</span> {order.salesman.staff.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Delivery Service Details */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p>
                <span className="font-medium">Service Provider:</span> {order.DeliveryService?.name}
              </p>
              <p>
                <span className="font-medium">Base Price:</span> ${parseFloat(order.DeliveryService?.basePrice || 0).toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Price per KM:</span> ${parseFloat(order.DeliveryService?.pricePerKm || 0).toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Delivery City:</span> {order.deliveryCity?.name}, {order.deliveryCity?.state}
              </p>
              <p>
                <span className="font-medium">Estimated Distance:</span> {order.estimatedDistance || 'N/A'} KM
              </p>
              <p className="text-sm text-gray-500 mt-2">
                * Delivery fee is calculated based on base price plus distance × price per KM
              </p>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate('/orders')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
