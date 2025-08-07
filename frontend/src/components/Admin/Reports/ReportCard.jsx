import React, { useState } from "react";
import {
  Calendar,
  User,
  MessageSquare,
  Ban,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import { getImageUrl } from "../../../utils/imageUtils";

const ReportCard = ({ report, onUpdateStatus }) => {
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState("disable");

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "under-review":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "resolved":
        return "bg-green-50 text-green-700 border-green-200";
      case "dismissed":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAction = (type) => {
    setActionType(type);
    setShowModal(true);
  };

  const confirmAction = () => {
    switch (actionType) {
      case "disable":
        onUpdateStatus(report.id, "resolved");
        break;
      case "dismiss":
        onUpdateStatus(report.id, "dismissed");
        break;
      case "review":
        onUpdateStatus(report.id, "under-review");
        break;
    }
    setShowModal(false);
  };

  const getActionMessage = () => {
    switch (actionType) {
      case "disable":
        return `Disable ${report.reportedUser.name}'s account? This will prevent them from accessing the platform.`;
      case "dismiss":
        return `Dismiss this report? The report will be marked as resolved without taking action.`;
      case "review":
        return `Mark this report as under review? This indicates you are investigating the issue.`;
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={getImageUrl(report.reportedUser.avatar)}
              alt={report.reportedUser.name}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {report.reportedUser.name}
              </h3>
              <p className="text-sm text-gray-500">
                {report.reportedUser.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                report.priority
              )}`}
            >
              {report.priority}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                report.status
              )}`}
            >
              {report.status.replace("-", " ")}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">
              {report.reason}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              By {report.reportedBy.name}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatDate(report.createdAt)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-6">
          <p>{report.description}</p>
        </div>

        {/* Actions */}
        {report.status === "pending" && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAction("review")}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Review</span>
            </button>
            <button
              onClick={() => handleAction("disable")}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Ban className="h-4 w-4" />
              <span>Disable</span>
            </button>
            <button
              onClick={() => handleAction("dismiss")}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              <span>Dismiss</span>
            </button>
          </div>
        )}

        {report.status === "under-review" && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAction("disable")}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Ban className="h-4 w-4" />
              <span>Disable</span>
            </button>
            <button
              onClick={() => handleAction("dismiss")}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              <span>Dismiss</span>
            </button>
          </div>
        )}

        {/* Review Info */}
        {report.reviewedAt && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            <span>
              Reviewed {formatDate(report.reviewedAt)} by {report.reviewedBy}
            </span>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmAction}
        title={`${
          actionType === "disable"
            ? "Disable Account"
            : actionType === "dismiss"
            ? "Dismiss Report"
            : "Mark Under Review"
        }`}
        message={getActionMessage()}
        confirmText={
          actionType === "disable"
            ? "Disable"
            : actionType === "dismiss"
            ? "Dismiss"
            : "Mark Under Review"
        }
        confirmButtonClass={
          actionType === "disable"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-indigo-600 hover:bg-indigo-700"
        }
      />
    </>
  );
};

export default ReportCard;
