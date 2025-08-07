import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, Edit, Trash2, Plus, X, Loader2, Users, Crown, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const AdminSubscriptionManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", price: 0, features: "", duration: 30, isActive: true });
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('plans');
  
  // New states for dynamic plan tabs and modals
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('basic');
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchPlans()]);
    setLoading(false);
  };

const fetchUsers = async () => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/v1/admin/subscriptions/users`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    setUsers(res.data.users);
  } catch (e) {
    toast.error("Failed to fetch users");
  }
};


  const fetchPlans = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/subscriptions/plans`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setPlans(res.data.plans);
    } catch (e) {
      toast.error("Failed to fetch plans");
    }
  };

  const handleShowPlan = (user) => {
    setSelectedUser(user);
    setShowPlanModal(true);
  };

  // Get unique plan types for tabs
  const getPlanTabs = () => {
    const planTypes = new Set();
    
    // Add basic for users without subscription
    planTypes.add('basic');
    
    // Add all plan names from active plans
    plans.forEach(plan => {
      if (plan.isActive) {
        planTypes.add(plan.name.toLowerCase());
      }
    });
    
    return Array.from(planTypes);
  };

  // Filter users by selected plan
  const getUsersByPlan = (planType) => {
    if (planType === 'basic') {
      return users.filter(user => {
        const hasNoSubscription = !user.subscription?.planName || !user.subscription?.isActive;
        const hasBasicPlan = user.subscription?.planName && 
          (user.subscription.planName.toLowerCase().includes('basic') || 
           user.subscription.planName.toLowerCase().includes('free'));
        return hasNoSubscription || hasBasicPlan;
      });
    } else {
      return users.filter(user => 
        user.subscription?.isActive && 
        user.subscription?.planName?.toLowerCase() === planType
      );
    }
  };

  const showSuccessNotification = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const handleCreatePlan = async () => {
    // Validation
    const name = planForm.name.trim();
    const featuresArr = planForm.features.split(",").map(f => f.trim()).filter(f => f);
    const price = Number(planForm.price);
    const duration = Number(planForm.duration);

    if (!name) {
      toast.error("Plan name is required.");
      return;
    }
    if (featuresArr.length === 0) {
      toast.error("At least one feature is required.");
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error("Price must be a non-negative number.");
      return;
    }
    if (isNaN(duration) || duration < 1) {
      toast.error("Duration must be at least 1 day.");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/subscriptions/plans`,
        { ...planForm, features: planForm.features },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      setShowCreatePlanModal(false);
      setPlanForm({ name: "", price: 0, features: "", duration: 30, isActive: true });
      await fetchPlans();
      showSuccessNotification("Plan created successfully!");
    } catch (error) {
      toast.error("Failed to create plan");
    }
  };

  const handleUpdatePlan = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/subscriptions/plans/${editingPlan._id}`,
        { ...planForm, features: planForm.features.split(",").map(f => f.trim()) },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      setShowEditPlanModal(false);
      setEditingPlan(null);
      setPlanForm({ name: "", price: 0, features: "", duration: 30, isActive: true });
      await fetchPlans();
      showSuccessNotification("Plan updated successfully!");
    } catch (error) {
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/subscriptions/plans/${planToDelete._id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      setShowDeleteConfirmModal(false);
      setPlanToDelete(null);
      await fetchPlans();
      showSuccessNotification("Plan deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      features: plan.features.join(", "),
      duration: plan.duration,
      isActive: plan.isActive,
    });
    setShowEditPlanModal(true);
  };

  const openDeleteModal = (plan) => {
    setPlanToDelete(plan);
    setShowDeleteConfirmModal(true);
  };

  const handleUpdateSubscription = async (planId) => {
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/v1/admin/subscriptions/user/${selectedUser._id}`,
      { planId },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    toast.success("Subscription updated");
    setShowPlanModal(false);
    
    // Auto-switch to premium view if user was upgraded from basic
    if (userFilter === 'basic' && planId) {
      setUserFilter('premium');
      toast.info("Switched to Premium Users view");
    }
    
    fetchUsers();
  };

  const handleDeleteSubscription = async () => {
    await axios.delete(
      `${import.meta.env.VITE_API_URL}/api/v1/admin/subscriptions/user/${selectedUser._id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    toast.success("Subscription cancelled");
    setShowPlanModal(false);
    fetchUsers();
  };

  const handlePlanFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlanForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Subscription Management</h2>
          <p className="text-gray-600 text-base">
            Manage subscription plans and assign them to users.
          </p>
        </div>

        {/* Section Toggle */}
        <div className="mb-6">
          <div className="flex items-center space-x-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1 w-fit">
            <button
              onClick={() => setActiveSection('plans')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeSection === 'plans'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Plan Management
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeSection === 'users'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              User Slots
            </button>
          </div>
        </div>

        {/* Manage Plans Section */}
        {activeSection === 'plans' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-gray-900">Manage Plans</h3>
              <button 
                onClick={() => setShowCreatePlanModal(true)}
                className="bg-indigo-500 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-600 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Plan</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No plans found.
                      </td>
                    </tr>
                  ) : (
                    plans.map((plan) => (
                      <tr key={plan._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{plan.name}</td>
                        <td className="px-6 py-4">₹{plan.price}</td>
                        <td className="px-6 py-4 max-w-xs truncate">{plan.features.join(", ")}</td>
                        <td className="px-6 py-4">{plan.duration} days</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${plan.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {plan.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => openEditModal(plan)}
                              className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50 transition-all"
                            >
                              <Edit className="w-4 h-4" /> 
                            </button>
                            <button 
                              onClick={() => openDeleteModal(plan)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" /> 
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Slots Section with Dynamic Plan Tabs */}
        {activeSection === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-gray-900">User Subscriptions</h3>
              
              {/* Dynamic Plan Filter Tabs */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {getPlanTabs().map((planType) => {
                  const userCount = getUsersByPlan(planType).length;
                  const isBasic = planType === 'basic';
                  const displayName = isBasic ? 'Basic' : planType.charAt(0).toUpperCase() + planType.slice(1);
                  
                  return (
                    <button
                      key={planType}
                      onClick={() => setSelectedPlanFilter(planType)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                        selectedPlanFilter === planType
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {isBasic ? <Users className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                      <span>{displayName} ({userCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] bg-gray-50">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getUsersByPlan(selectedPlanFilter).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          No {selectedPlanFilter} users found.
                        </td>
                      </tr>
                    ) : (
                      getUsersByPlan(selectedPlanFilter).map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 flex items-center space-x-2">
                            <span>{u.firstName} {u.lastName}</span>
                            {selectedPlanFilter !== 'basic' && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </td>
                          <td className="px-6 py-4">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.subscription?.planName ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {u.subscription?.planName || "None"}
                            </span>
                          </td>
                          <td className="px-6 py-4">{u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toLocaleDateString() : "-"}</td>
                          <td className="px-6 py-4">
                            <button
                              className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-medium px-2 py-1 rounded hover:bg-indigo-100 transition"
                              onClick={() => handleShowPlan(u)}
                            >
                              <Eye className="inline w-4 h-4" /> 
                              <span>{selectedPlanFilter === 'basic' ? 'Upgrade' : 'Details'}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200 transform transition-all">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              onClick={() => setShowCreatePlanModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
                <Plus className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Create New Plan</h3>
              <p className="text-gray-600 mt-1">Add a new subscription plan for users</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., Premium, Elite, VIP"
                  name="name"
                  value={planForm.name}
                  onChange={handlePlanFormChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="0"
                    name="price"
                    type="number"
                    value={planForm.price}
                    onChange={handlePlanFormChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="30"
                    name="duration"
                    type="number"
                    value={planForm.duration}
                    onChange={handlePlanFormChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  placeholder="Unlimited messages, Advanced search, Priority support"
                  name="features"
                  rows="3"
                  value={planForm.features}
                  onChange={handlePlanFormChange}
                />
                <p className="text-xs text-gray-500 mt-1">Separate features with commas</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={planForm.isActive}
                  onChange={handlePlanFormChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Plan</label>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowCreatePlanModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-md"
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditPlanModal && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200 transform transition-all">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              onClick={() => setShowEditPlanModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <Edit className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Edit Plan</h3>
              <p className="text-gray-600 mt-1">Update plan details</p>
            </div>

            {/* Same form fields as create modal */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Premium, Elite, VIP"
                  name="name"
                  value={planForm.name}
                  onChange={handlePlanFormChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                    name="price"
                    type="number"
                    value={planForm.price}
                    onChange={handlePlanFormChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="30"
                    name="duration"
                    type="number"
                    value={planForm.duration}
                    onChange={handlePlanFormChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Unlimited messages, Advanced search, Priority support"
                  name="features"
                  rows="3"
                  value={planForm.features}
                  onChange={handlePlanFormChange}
                />
                <p className="text-xs text-gray-500 mt-1">Separate features with commas</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  name="isActive"
                  checked={planForm.isActive}
                  onChange={handlePlanFormChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActiveEdit" className="text-sm font-medium text-gray-700">Active Plan</label>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowEditPlanModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePlan}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
              >
                Update Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Plan</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the <span className="font-semibold text-red-600">"{planToDelete.name}"</span> plan? 
                This action cannot be undone.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Users with this plan will lose their subscription benefits.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePlan}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md"
                >
                  Delete Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative border border-gray-200 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Plan Modal for User Assignment */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setShowPlanModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-bold mb-2 text-xl text-gray-900">
              Subscription for {selectedUser.firstName} {selectedUser.lastName}
            </h4>
            <div className="mb-4">
              <div className="mb-1">
                <span className="text-gray-600">Current Plan: </span>
                <b className="text-indigo-700">{selectedUser.subscription?.planName || "None"}</b>
              </div>
              <div>
                <span className="text-gray-600">Expires: </span>
                {selectedUser.subscription?.expiresAt ? (
                  <span className="text-gray-800">{new Date(selectedUser.subscription.expiresAt).toLocaleDateString()}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-700">
                {selectedPlanFilter === 'basic' ? 'Upgrade to Plan' : 'Update Plan'}
              </label>
              <select
                className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-400"
                value={selectedUser.subscription?.plan?._id || ""}
                onChange={(e) => handleUpdateSubscription(e.target.value)}
              >
                <option value="">Select Plan</option>
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} - ₹{plan.price}
                  </option>
                ))}
              </select>
            </div>
            {selectedPlanFilter !== 'basic' && (
              <button
                className="bg-red-500 text-white px-4 py-2 rounded mt-2 w-full hover:bg-red-600 transition"
                onClick={handleDeleteSubscription}
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionManagementPage;
