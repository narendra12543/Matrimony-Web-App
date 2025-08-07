const FeedbackSummary = ({ averageRating, totalFeedback }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
    <div className="bg-indigo-100 p-6 rounded-xl shadow text-center">
      <h3 className="text-lg font-semibold">⭐ Average Rating</h3>
      <p className="text-3xl font-bold text-indigo-600">{averageRating}</p>
    </div>
    <div className="bg-green-100 p-6 rounded-xl shadow text-center">
      <h3 className="text-lg font-semibold">💬 Total Feedback</h3>
      <p className="text-3xl font-bold text-green-600">{totalFeedback}</p>
    </div>
  </div>
);
export default FeedbackSummary;
