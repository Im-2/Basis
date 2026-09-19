export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="13" width="7" height="11" rx="2" fill="#FFFFFF" fillOpacity="0.85" />
      <rect x="15" y="4" width="7" height="20" rx="2" fill="#F84203" />
      <path d="M9 13L15 7" stroke="#F86EBC" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="7" r="2" fill="#F86EBC" />
    </svg>
  );
}
