import React, { useState, useEffect } from "react";
// import AdminLayout from '../components/Admin/AdminLayout';
// import FeedbackSummary from '../components/Admin/Feedback/FeedbackSummary';
// import FeedbackTable from '../components/Admin/Feedback/FeedbackTable';
// import FeaturedStories from '../components/Admin/Feedback/FeaturedStories';
// import mockFeedback from '../utils/mockFeedbackData';

const AdminFeedbackPage = () => {
  // const [feedback, setFeedback] = useState([]);

  // useEffect(() => {
  //   // Replace this with actual API call
  //   setFeedback(mockFeedback);
  // }, []);

  // const handleFeatureToggle = (id) => {
  //   setFeedback((prev) =>
  //     prev.map((fb) => (fb.id === id ? { ...fb, isFeatured: !fb.isFeatured } : fb))
  //   );
  // };

  // const averageRating =
  //   feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length;

  return (
    // <AdminLayout title="Feedback & Success Analytics">
    //   <div className="space-y-6">
    //     <FeedbackSummary averageRating={averageRating.toFixed(2)} totalFeedback={feedback.length} />
    //     <FeedbackTable feedback={feedback} onFeatureToggle={handleFeatureToggle} />
    //     <FeaturedStories feedback={feedback} />
    //   </div>
    // </AdminLayout>
    <>
      <h1>Feedbackpage</h1>
    </>
  );
};

export default AdminFeedbackPage;
