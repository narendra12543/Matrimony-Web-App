const FeaturedStories = ({ feedback }) => {
  const featured = feedback.filter((fb) => fb.isFeatured);

  return (
    <div className="bg-yellow-50 p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">🌟 Featured Success Stories</h2>
      {featured.length === 0 ? (
        <p className="italic text-gray-500">No featured stories selected.</p>
      ) : (
        <ul className="space-y-3">
          {featured.map((fb) => (
            <li key={fb.id} className="border-l-4 border-yellow-400 pl-4 italic text-gray-700">
              “{fb.comment}” — <strong>{fb.username}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FeaturedStories;
