const FeedbackTable = ({ feedback, onFeatureToggle }) => (
  <div className="overflow-x-auto bg-white p-6 rounded-xl shadow mb-8">
    <h2 className="text-xl font-semibold mb-4">User Feedback</h2>
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100 text-left">
        <tr>
          <th className="p-2">User</th>
          <th className="p-2">Rating</th>
          <th className="p-2">Comment</th>
          <th className="p-2">Date</th>
          <th className="p-2">Featured</th>
        </tr>
      </thead>
      <tbody>
        {feedback.map((fb) => (
          <tr key={fb.id} className="border-t">
            <td className="p-2">{fb.username}</td>
            <td className="p-2">{'⭐'.repeat(Math.round(fb.rating))}</td>
            <td className="p-2">{fb.comment}</td>
            <td className="p-2">{fb.date}</td>
            <td className="p-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fb.isFeatured}
                  onChange={() => onFeatureToggle(fb.id)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </label>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
export default FeedbackTable;
