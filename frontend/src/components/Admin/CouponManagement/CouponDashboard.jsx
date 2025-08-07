import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { couponAPI, analyticsAPI } from "../../../services/couponService";
import toast from "react-hot-toast";
import {
  Plus,
  Tag,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  Grid3X3,
  Loader,
} from "lucide-react";
import CouponAnalytics from "./CouponAnalytics";

const CouponDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeView, setActiveView] = useState("dashboard");
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
 

  // Fetch overview statistics
  const fetchStats = async () => {
    try {
      const response = await analyticsAPI.getOverview();
      const data = response.data;

      setStats([
        {
          title: "Total Coupons",
          value: data.totalCoupons.toString(),
          icon: Tag,
          color: "bg-blue-500",

          changeColor: "text-green-600",
        },
        {
          title: "Active Coupons",
          value: data.activeCoupons.toString(),
          icon: TrendingUp,
          color: "bg-green-500",

          changeColor: "text-green-600",
        },
        {
          title: "Total Redemptions",
          value: data.totalRedemptions.toLocaleString(),
          icon: Users,
          color: "bg-purple-500",

          changeColor: "text-green-600",
        },
        {
          title: "Revenue Impact",
          value: `₹${data.totalRevenue.toLocaleString()}`,
          icon: DollarSign,
          color: "bg-orange-500",

          changeColor: "text-green-600",
        },
      ]);
    } catch (error) {
      toast.error("Failed to fetch statistics");
    }
  };

  // Fetch coupons
  const fetchCoupons = async (page = 1) => {
    try {
      setLoading(true);
      // Debug: Log which API is being called
      console.log("Calling couponAPI.getCoupons for admin dashboard");
      const response = await couponAPI.getCoupons({
        page,
        limit: 10,
        status: filterStatus,
        search: searchTerm,
      });

      setCoupons(response.data.coupons);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total,
      });
    } catch (error) {
      toast.error("Failed to fetch coupons");
      // Debug: Log error details
      console.error("Coupon fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // // Fetch all plans for mapping planId to plan name
  // const fetchPlans = async () => {
  //   try {
  //     const res = await couponAPI.getAllPlansForAdmin();
  //     setPlans(res.data.plans || []);
  //   } catch (e) {
  //     // Optionally toast error
  //   }
  // };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchCoupons();
   
  }, []);

  // Filter/search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCoupons(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus]);

  const getStatusColor = (coupon) => {
    if (!coupon.isActive) return "bg-gray-100 text-gray-800";
    if (new Date(coupon.expiresAt) < new Date())
      return "bg-red-100 text-red-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusText = (coupon) => {
    if (!coupon.isActive) return "inactive";
    if (new Date(coupon.expiresAt) < new Date()) return "expired";
    return "active";
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await couponAPI.deleteCoupon(id);
        toast.success("Coupon deleted successfully");
        fetchCoupons(pagination.currentPage);
        fetchStats();
      } catch (error) {
        toast.error("Failed to delete coupon");
      }
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard");
  };

  

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Coupon Management
            </h1>
            <p className="text-gray-600">
              Create, manage, and track coupon performance
            </p>
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeView === "dashboard"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView("analytics")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeView === "analytics"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Analytics</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {/* Mobile View Toggle */}
          <div className="sm:hidden flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`p-2 rounded-md transition-all duration-200 ${
                activeView === "dashboard"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView("analytics")}
              className={`p-2 rounded-md transition-all duration-200 ${
                activeView === "analytics"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => navigate("/admin/coupons/create")}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Conditional Rendering */}
      {activeView === "analytics" ? (
        <CouponAnalytics />
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span
                        className={`text-sm font-medium ${stat.changeColor}`}
                      >
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search coupons..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Coupons Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : coupons.length === 0 ? (
                <div className="flex justify-center items-center py-12 text-gray-500">
                  No coupons found.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coupon Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-purple-100 p-2 rounded-lg mr-3">
                              <Tag className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {coupon.code}
                              </div>
                              <div className="text-sm text-gray-500">
                                {coupon.applicablePlans &&
                                coupon.applicablePlans.length > 0
                                  ? coupon.applicablePlans
                                      .map((plan) => plan.name)
                                      .join(", ")
                                  : "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {coupon.type === "percentage"
                              ? `${coupon.value}%`
                              : `₹${coupon.value}`}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {coupon.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {coupon.usageCount} / {coupon.usageLimit || "∞"}
                          </div>
                          {coupon.usageLimit && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (coupon.usageCount / coupon.usageLimit) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              coupon
                            )}`}
                          >
                            {getStatusText(coupon)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            {new Date(coupon.expiresAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                navigate(`/admin/coupons/edit/${coupon._id}`)
                              }
                              className="text-blue-600 hover:text-blue-800 p-1 rounded"
                              title="Edit coupon"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopy(coupon.code)}
                              className="text-gray-600 hover:text-gray-800 p-1 rounded"
                              title="Copy coupon code"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon._id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded"
                              title="Delete coupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {Math.min(
                    (pagination.currentPage - 1) * 10 + 1,
                    pagination.total
                  )}{" "}
                  to {Math.min(pagination.currentPage * 10, pagination.total)}{" "}
                  of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchCoupons(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchCoupons(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CouponDashboard;
