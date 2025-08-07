import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useAuth } from "../../../contexts/Chat/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axios from "axios";
import notificationService from "../../../services/notificationService";
import { useNotifications } from "../../../contexts/Chat/NotificationContext";

const DashboardLayout = () => {
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [notified, setNotified] = useState(false); // Add this line
  const navigate = useNavigate();
  const { user, setUser } = useAuth(); // Get setUser from useAuth
  const queryClient = useQueryClient();
  const { showInPageNotification } = useNotifications();

  useEffect(() => {
    if (user) {
      const isNewUserFlag = user.isNewUser;
      if (user.trial?.isActive && user.trial?.endDate) {
        const endDate = new Date(user.trial.endDate);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setTrialDaysRemaining(diffDays > 0 ? diffDays : 0);

        if (isNewUserFlag && diffDays > 0) {
          setShowTrialPopup(true);
          notificationService.showNotification({
            title: "Complete Your Profile!",
            body: "To get the best matches and experience, please update your profile now.",
            icon: "/path/to/your/icon.png", // You might want to add a relevant icon here
            onClick: () => navigate("/profile"),
          });
        }
      } else {
        setTrialDaysRemaining(0);
      }
    }
  }, [user]);

  // Refetch notifications and show toast/in-page notification when approved
  React.useEffect(() => {
    if (user?.approvalStatus === "approved" && !notified) {
      queryClient.invalidateQueries(["notifications"]);
      setNotified(true);
    }
  }, [user?.approvalStatus, queryClient, showInPageNotification, notified]);

  const handlePopupClose = async () => {
    setShowTrialPopup(false);
    if (user && user.isNewUser) {
      try {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/v1/users/update-is-new-user`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // Don't update user context here - isNewUser should only change after admin approval
        // setUser({ ...user, isNewUser: false }); // Remove this line
      } catch (error) {
        console.error("Failed to dismiss welcome popup", error);
      }
    }
  };

  return (
    <div className="w-full">
      <Outlet />

      {showTrialPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-900 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center relative overflow-hidden border border-purple-200 dark:border-gray-600"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10">
              <div className="text-6xl mb-4 animate-bounce-once">🎉</div>
              <h3 className="text-3xl font-bold text-purple-800 dark:text-purple-300 mb-3">
                Trial Unlocked!
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-200 mb-4">
                You have{" "}
                <span className="font-extrabold text-purple-600 dark:text-purple-400">
                  {trialDaysRemaining} day(s)
                </span>{" "}
                of free premium features!
              </p>
              <p className="text-md text-gray-600 dark:text-gray-300 mb-6 font-semibold">
                To unlock the full potential of your trial and receive the best
                matches, it's crucial to complete your profile now!
              </p>
              <button
                onClick={() => {
                  handlePopupClose();
                  navigate("/profile");
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
              >
                Update My Profile
              </button>
              <button
                onClick={handlePopupClose}
                className="mt-3 w-full text-gray-600 dark:text-gray-300 py-2 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        @keyframes animate-blob {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        @keyframes animate-bounce-once {
          0%,
          100% {
            transform: translateY(0);
          }
          20% {
            transform: translateY(-10px);
          }
          40% {
            transform: translateY(0);
          }
          60% {
            transform: translateY(-5px);
          }
          80% {
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: animate-blob 7s infinite cubic-bezier(0.6, 0.01, 0.3, 0.9);
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-bounce-once {
          animation: animate-bounce-once 1s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
