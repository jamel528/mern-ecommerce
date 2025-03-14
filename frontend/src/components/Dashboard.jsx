import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const getRoleSpecificContent = () => {
    switch (user.role) {
      case "admin":
        return (
          <div className="space-y-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Admin Dashboard
                </h3>
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-500">
                    Welcome to the admin dashboard. You have full access to manage
                    users and system settings.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                      to="/admin/users"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Manage Users
                    </Link>
                    <Link
                      to="/admin/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Manage Products
                    </Link>
                    <Link
                      to="/orders"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Order Management
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "staff":
        return (
          <div className="space-y-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Staff Dashboard
                </h3>
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-500">
                    Welcome to the staff dashboard. You can manage products and
                    view reports here.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                      to="/staff/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Manage Products
                    </Link>
                    <Link
                      to="/staff/reports"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      View Reports
                    </Link>
                    <Link
                      to="/orders"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Orders
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "salesman":
        return (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Salesman Dashboard
              </h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Welcome to your dashboard. Track your sales and performance
                  metrics here.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Link
                    to="/orders"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Orders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">
                User Dashboard
              </h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Welcome to ShopEase. Your one-stop shop for all your needs.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-xl font-bold text-gray-900">
            Welcome, {user.name}!
          </h2>
          <p className="mt-1 text-sm text-gray-500">Role: {user.role}</p>
        </div>
      </div>

      {getRoleSpecificContent()}

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-gray-50 px-4 py-5 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Last Login
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {new Date().toLocaleDateString()}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Account Status
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                Active
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
