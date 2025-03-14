import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import UserManagement from "./components/Admin/UserManagement";
import SalesmenManagement from "./components/Staff/SalesmenManagement";
import ProductManagement from "./components/Admin/ProductManagement";
import ProductForm from "./components/Admin/ProductForm";
import OrderManagement from "./components/Orders/OrderManagement";
import OrderForm from "./components/Orders/OrderForm";
import OrderDetails from "./components/Orders/OrderDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";
import Profile from "./components/Profile";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ProductManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/products"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <ProductManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/products/new"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/products/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/salesmen"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <SalesmenManagement />
                </ProtectedRoute>
              }
            />
            {/* Order Management Routes */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'salesman']}>
                  <OrderManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/new"
              element={
                <ProtectedRoute allowedRoles={['staff', 'salesman']}>
                  <OrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'salesman']}>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
