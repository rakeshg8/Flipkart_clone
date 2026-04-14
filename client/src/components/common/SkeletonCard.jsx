const SkeletonCard = () => {
  return (
    <div className="fk-card overflow-hidden p-3">
      <div className="skeleton h-40 w-full" />
      <div className="mt-3 space-y-2">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-2/5" />
        <div className="skeleton h-4 w-3/5" />
      </div>
    </div>
  );
};

export default SkeletonCard;
