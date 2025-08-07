import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Mail,
  Send,
  Paperclip,
  Users,
  Clock,
  Settings,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  Bold,
  Italic,
  List,
  Newspaper,
  Bell,
  BellOff,
  ChevronsUpDown,
} from "lucide-react";

// --- Create a dedicated Axios instance for Admin API calls ---
// This instance will automatically include the admin token in its headers.
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`, // Use environment variable
});

// Use an interceptor to add the token to every request made by this instance
apiClient.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Reusable UI Components (No changes needed here) ---

const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
      isActive
        ? "bg-indigo-600 text-white shadow-md"
        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`}
  >
    {label}
  </button>
);

const Toast = ({ message, type, onDismiss }) => {
  const baseClasses =
    "fixed top-5 right-5 max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50";
  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
  };
  const colors = {
    success: "border-green-500",
    error: "border-red-500",
  };

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${baseClasses} border-l-4 ${colors[type]}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className="inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Composer Component (Handles all email types) ---
const EmailComposer = ({ onSend, setToast }) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [type, setType] = useState("newsletter");
  const [target, setTarget] = useState("all");
  const [targetEmail, setTargetEmail] = useState("");

  const handleFileChange = (e) => setAttachments([...e.target.files]);
  const removeAttachment = (fileName) =>
    setAttachments(attachments.filter((file) => file.name !== fileName));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !subject.trim() ||
      !content.trim() ||
      (target === "specific" && !targetEmail.trim())
    ) {
      setToast({
        message: "Please fill out all required fields.",
        type: "error",
      });
      return;
    }
    setIsSending(true);
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("content", content);
    formData.append("type", type);
    formData.append("target", target);
    if (target === "specific") formData.append("targetEmail", targetEmail);
    attachments.forEach((file) => formData.append("attachments", file));

    const success = await onSend(formData);
    if (success) {
      setToast({ message: "Email sent successfully!", type: "success" });
      setSubject("");
      setContent("");
      setAttachments([]);
      setTarget("all");
      setType("newsletter");
    } else {
      setToast({
        message: "Failed to send email. Please try again.",
        type: "error",
      });
    }
    setIsSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email Type
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="newsletter">Newsletter</option>
            <option value="recommendation">Daily Recommendations</option>
            <option value="general">General Announcement</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="target"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Target Audience
          </label>
          <select
            id="target"
            name="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Active Users</option>
            <option value="newsletter">Newsletter Subscribers</option>
            <option value="recommendation">Recommendation Subscribers</option>
            <option value="specific">Specific Email</option>
          </select>
        </div>
      </div>
      {target === "specific" && (
        <div>
          <label
            htmlFor="targetEmail"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Recipient Email
          </label>
          <input
            type="email"
            name="targetEmail"
            id="targetEmail"
            required
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="user@example.com"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
          />
        </div>
      )}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Subject
        </label>
        <input
          type="text"
          name="subject"
          id="subject"
          required
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Announcing our new feature!"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Content (HTML)
        </label>
        <textarea
          id="content"
          name="content"
          rows="10"
          required
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono"
          placeholder="<h1>Hello World</h1>"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Attachments
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600 dark:text-gray-400">
              <label
                htmlFor="attachments"
                className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-800 focus-within:ring-indigo-500"
              >
                <span>Upload files</span>
                <input
                  id="attachments"
                  name="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="text-xs text-gray-500">
                {attachments.length} file(s) selected
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSending}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isSending ? (
            "Sending..."
          ) : (
            <>
              <Send className="-ml-1 mr-2 h-5 w-5" />
              Send Email
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// --- History Tab ---
const HistoryTab = ({ sentEmails, isLoading }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Subject
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Type
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Attachments
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Sent At
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <tr>
            <td colSpan="4" className="text-center py-4">
              Loading...
            </td>
          </tr>
        ) : (
          sentEmails.map((email) => (
            <tr
              key={email._id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {email.subject}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                {email.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {email.attachments.length > 0
                  ? email.attachments.map((a) => a.filename).join(", ")
                  : "None"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {new Date(email.sentAt).toLocaleString()}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// --- Subscribers Tab ---
const SubscribersTab = ({ subscribers, isLoading, onUpdate }) => {
  const [filter, setFilter] = useState("");
  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(filter.toLowerCase())
  );

  const handleToggle = (userId, setting) => {
    const user = subscribers.find((s) => s._id === userId);
    if (user) {
      const newSettings = {
        ...user.notificationSettings.email,
        [setting]: !user.notificationSettings.email[setting],
      };
      onUpdate(userId, newSettings);
    }
  };

  return (
    <div>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Newsletter
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Recommendations
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Platform Updates
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 text-sm font-medium">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggle(user._id, "newsletter")}
                    >
                      {user.notificationSettings.email.newsletter ? (
                        <Bell className="text-green-500" />
                      ) : (
                        <BellOff className="text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() =>
                        handleToggle(user._id, "dailyRecommendations")
                      }
                    >
                      {user.notificationSettings.email.dailyRecommendations ? (
                        <Bell className="text-green-500" />
                      ) : (
                        <BellOff className="text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggle(user._id, "platformUpdates")}
                    >
                      {user.notificationSettings.email.platformUpdates ? (
                        <Bell className="text-green-500" />
                      ) : (
                        <BellOff className="text-gray-400" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Integrated Component ---
export default function AdminEmailManagement() {
  const [activeTab, setActiveTab] = useState("compose");
  const [subscribers, setSubscribers] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subsRes, emailsRes] = await Promise.all([
        apiClient.get("/email/subscribers"), // Use apiClient
        apiClient.get("/email/history"), // Use apiClient
      ]);
      setSubscribers(subsRes.data);
      setSentEmails(emailsRes.data);
    } catch (error) {
      setToast({
        message: "Failed to fetch data. Are you logged in as admin?",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendEmail = async (formData) => {
    try {
      const response = await apiClient.post("/email/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }); // Use apiClient

      // Handle the new response format with detailed results
      const { message, results } = response.data;

      if (results && results.failed > 0) {
        // Show warning if some emails failed
        setToast({
          message: `${message} Check console for details.`,
          type: "error",
        });
        console.log("Email sending results:", results);
      } else {
        setToast({ message: message, type: "success" });
      }

      fetchData();
      return true;
    } catch (err) {
      console.error("Email sending error:", err);

      // Provide more specific error messages
      let errorMessage = "Failed to send email. Please try again.";

      if (err.response) {
        const { data } = err.response;
        if (data && data.error) {
          errorMessage = data.error;
          if (data.details) {
            errorMessage += `: ${data.details}`;
          }
        } else if (data && data.message) {
          errorMessage = data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setToast({ message: errorMessage, type: "error" });
      return false;
    }
  };

  const handleUpdatePreferences = async (id, newSettings) => {
    try {
      await apiClient.put(`/email/subscribers/${id}`, {
        notificationSettings: newSettings,
      }); // Use apiClient
      setSubscribers((prev) =>
        prev.map((sub) =>
          sub._id === id
            ? {
                ...sub,
                notificationSettings: {
                  ...sub.notificationSettings,
                  email: newSettings,
                },
              }
            : sub
        )
      );
      setToast({ message: "Preferences updated!", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to update preferences.", type: "error" });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
        <TabButton
          label="Compose"
          isActive={activeTab === "compose"}
          onClick={() => setActiveTab("compose")}
        />
        <TabButton
          label="History"
          isActive={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
        <TabButton
          label="Subscribers"
          isActive={activeTab === "subscribers"}
          onClick={() => setActiveTab("subscribers")}
        />
      </div>
      <div>
        {activeTab === "compose" && (
          <EmailComposer onSend={handleSendEmail} setToast={setToast} />
        )}
        {activeTab === "history" && (
          <HistoryTab sentEmails={sentEmails} isLoading={isLoading} />
        )}
        {activeTab === "subscribers" && (
          <SubscribersTab
            subscribers={subscribers}
            isLoading={isLoading}
            onUpdate={handleUpdatePreferences}
          />
        )}
      </div>
    </div>
  );
}
