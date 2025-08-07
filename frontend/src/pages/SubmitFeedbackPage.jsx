import React, { useState } from "react";
import axios from "axios";

const SubmitFeedbackForm = () => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/v1/feedback", { rating, comment }, { withCredentials: true });
      alert("Feedback submitted!");
      setComment("");
      setRating(5);
    } catch (err) {
      console.error(err);
      alert("Error submitting feedback");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label>
        Rating:
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your feedback..."
        required
        className="w-full p-2 border"
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        Submit Feedback
      </button>
    </form>
  );
};

export default SubmitFeedbackForm;
