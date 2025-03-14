import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const OrderForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deliveryServices, setDeliveryServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDeliveryService, setSelectedDeliveryService] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [formData, setFormData] = useState({
    customerId: '',
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    deliveryServiceId: '',
    deliveryCityId: ''
  });

  // Fetch available products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data.products.filter(p => p.stock > 0 && p.status === 'active'));
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    }
  }, []);

  // Fetch active delivery services
  const fetchDeliveryServices = useCallback(async () => {
    try {
      const response = await api.get('/api/delivery-services');
      setDeliveryServices(response.data.deliveryServices.filter(ds => ds.isActive));
    } catch (err) {
      setError('Failed to fetch delivery services');
      console.error('Error fetching delivery services:', err);
    }
  }, []);

  // Fetch active cities
  const fetchCities = useCallback(async () => {
    try {
      const response = await api.get('/api/cities');
      setCities(response.data.cities.filter(c => c.isActive));
    } catch (err) {
      setError('Failed to fetch cities');
      console.error('Error fetching cities:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchDeliveryServices();
    fetchCities();
  }, [fetchProducts, fetchDeliveryServices, fetchCities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('shipping.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProducts(prev => [...prev, {
        productId,
        name: product.name,
        price: product.price,
        quantity: 1,
        maxQuantity: product.stock
      }]);
    }
  };

  const handleQuantityChange = (index, value) => {
    const newQuantity = Math.min(
      Math.max(1, parseInt(value) || 0),
      selectedProducts[index].maxQuantity
    );
    
    setSelectedProducts(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveProduct = (index) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeliveryServiceChange = (e) => {
    const { value } = e.target;
    const service = deliveryServices.find(s => s.id === value);
    setSelectedDeliveryService(service);
    handleInputChange(e);
    calculateDeliveryFee(service, selectedCity);
  };

  const handleDeliveryCityChange = (e) => {
    const { value } = e.target;
    const city = cities.find(c => c.id === value);
    setSelectedCity(city);
    handleInputChange(e);
    calculateDeliveryFee(selectedDeliveryService, city);
  };

  const calculateDeliveryFee = (service, city) => {
    if (!service || !city) {
      setDeliveryFee(0);
      return;
    }

    // Calculate estimated distance based on city (simplified for demo)
    const estimatedDistance = 50; // TODO: Implement actual distance calculation
    const fee = Number(service.basePrice) + (estimatedDistance * Number(service.pricePerKm));
    setDeliveryFee(fee);
  };

  const calculateSubtotal = () => {
    return selectedProducts.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + deliveryFee;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        ...formData,
        items: selectedProducts.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await api.post('/api/orders', orderData);
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
      console.error('Error creating order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Order</h1>
        <button
          onClick={() => navigate('/orders')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Orders
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Customer ID
            </label>
            <input
              type="text"
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Add Product
            </label>
            <select
              onChange={handleProductSelect}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value=""
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Selected Products</h3>
              <div className="space-y-4">
                {selectedProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        min="1"
                        max={item.maxQuantity}
                        className="w-20 shadow border rounded py-1 px-2 text-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee:</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shipping Address */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Street
              </label>
              <input
                type="text"
                name="shipping.street"
                value={formData.shippingAddress.street}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                City
              </label>
              <input
                type="text"
                name="shipping.city"
                value={formData.shippingAddress.city}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                State
              </label>
              <input
                type="text"
                name="shipping.state"
                value={formData.shippingAddress.state}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                name="shipping.zipCode"
                value={formData.shippingAddress.zipCode}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Country
              </label>
              <input
                type="text"
                name="shipping.country"
                value={formData.shippingAddress.country}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
          <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Delivery Service
              </label>
              <select
                name="deliveryServiceId"
                value={formData.deliveryServiceId}
                onChange={handleDeliveryServiceChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a delivery service</option>
                {deliveryServices.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - Base: ${service.basePrice}, Per KM: ${service.pricePerKm}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Delivery City
              </label>
              <select
                name="deliveryCityId"
                value={formData.deliveryCityId}
                onChange={handleDeliveryCityChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.state}, {city.country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || selectedProducts.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Order
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
