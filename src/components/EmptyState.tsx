export default function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: { label: string; target: string };
}) {
  return (
    <div className="py-16 text-center text-journal-text-muted">
      <p className="text-base">{message}</p>
      {action && (
        <button
          onClick={() =>
            document.getElementById(action.target)?.scrollIntoView({ behavior: 'smooth' })
          }
          className="mt-4 rounded-lg bg-journal-accent px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
