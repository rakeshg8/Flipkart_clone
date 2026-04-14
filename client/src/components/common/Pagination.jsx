const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(page - 2, 0), Math.min(page + 1, totalPages));

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          type="button"
          key={p}
          onClick={() => onPageChange(p)}
          className={`rounded px-3 py-1 text-sm ${p === page ? "bg-fkBlue text-white" : "border border-slate-300"}`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
