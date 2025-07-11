import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Settings, X, Check, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../contexts/Chat/NotificationContext';
import notificationService from '../../services/notificationService';

const NotificationSettings = ({ isOpen, onClose }) => {
  const { 
    isSupported, 
    permission, 
    isEnabled, 
    enableNotifications, 
    disableNotifications 
  } = useNotifications();

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Granted', color: 'text-emerald-600', icon: Check };
      case 'denied':
        return { text: 'Denied', color: 'text-red-600', icon: X };
      default:
        return { text: 'Not requested', color: 'text-amber-600', icon: AlertCircle };
    }
  };

  const status = getPermissionStatus();
  const StatusIcon = status.icon;

  if (!isSupported) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Notifications Not Supported
                </h3>
                <p className="text-gray-600 mb-4">
                  Your browser doesn't support notifications.
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Notification Settings
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Permission Status */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Browser Permission
                  </span>
                  <div className={`flex items-center space-x-1 ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{status.text}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Required to show desktop notifications
                </p>
              </div>

              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {isEnabled ? (
                    <Bell className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Message Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Get notified when you receive new messages
                    </p>
                  </div>
                </div>
                <button
                  onClick={isEnabled ? disableNotifications : enableNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isEnabled ? 'bg-rose-500' : 'bg-gray-300'
                  }`}
                  disabled={permission === 'denied'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Permission Denied Help */}
              {permission === 'denied' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Notifications Blocked
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        To enable notifications, click the lock icon in your browser's address bar and allow notifications for this site.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Notification */}
              {isEnabled && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      notificationService.showNotification({
                        title: 'Test Notification',
                        body: 'Notifications are working perfectly! 🎉',
                        tag: 'test-notification'
                      });
                    }}
                    className="w-full px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    Send Test Notification
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationSettings;