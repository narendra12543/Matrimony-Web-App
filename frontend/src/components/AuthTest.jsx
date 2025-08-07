import React, { useState } from 'react';
import { useAuth } from '../contexts/Chat/AuthContext';
import { getTokenInfo } from '../utils/tokenUtils';
import axios from 'axios';

const AuthTest = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`);
      setTestResult({ success: true, data: response.data });
    } catch (error) {
      setTestResult({ success: false, error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  const token = localStorage.getItem("token");
  const tokenInfo = getTokenInfo(token);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
      
      <div className="space-y-2 mb-4">
        <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Not logged in'}</p>
        <p><strong>User ID:</strong> {user?._id || 'N/A'}</p>
        <p><strong>Token exists:</strong> {token ? 'Yes' : 'No'}</p>
        <p><strong>Token valid:</strong> {tokenInfo.valid ? 'Yes' : 'No'}</p>
        <p><strong>Token expired:</strong> {tokenInfo.expired ? 'Yes' : 'No'}</p>
        <p><strong>Token length:</strong> {tokenInfo.length || 'N/A'}</p>
      </div>

      <button
        onClick={testAuth}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Auth API'}
      </button>

      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <h4 className="font-semibold mb-2">Test Result:</h4>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthTest; 