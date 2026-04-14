const RatingStars = ({ rating = 0 }) => {
  return (
    <span className="inline-flex items-center rounded bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
      {Number(rating).toFixed(1)} ★
    </span>
  );
};

export default RatingStars;
