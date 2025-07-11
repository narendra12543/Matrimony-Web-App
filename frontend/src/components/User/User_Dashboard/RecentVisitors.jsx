import React, { useEffect, useState } from 'react';
import { getVisitors } from '../../../services/visitorService';
import { useAuth } from '../../../contexts/Chat/AuthContext';

function RecentVisitors() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getVisitors(user._id)
      .then(data => setVisitors(data))
      .catch(() => setVisitors([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <section className="bg-white rounded-2xl p-4 lg:p-8 shadow-lg hover:shadow-xl w-full transition-all duration-300 border border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-gray-800 flex items-center gap-3">
        <span className="text-xl lg:text-2xl">👀</span>
        Recent Visitors
      </h2>
      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : visitors.length === 0 ? (
        <div className="text-center text-gray-400">No recent visitors</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-6 justify-items-center">
          {visitors.map(v => (
            <div
              key={v._id}
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg border-2 border-transparent hover:border-purple-200 flex items-center justify-center"
              title={v.visitorUserId?.firstName + ' ' + v.visitorUserId?.lastName}
            >
              {v.visitorUserId?.avatar ? (
                <img src={v.visitorUserId.avatar} alt={v.visitorUserId.firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-purple-700">
                  {v.visitorUserId?.firstName?.[0]}
                  {v.visitorUserId?.lastName?.[0]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecentVisitors;
