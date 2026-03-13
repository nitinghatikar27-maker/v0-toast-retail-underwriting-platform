export function ToastLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="8" fill="currentColor" className="text-primary" />
      <path
        d="M12 16h16M12 24h16"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="3" fill="white" />
      <text
        x="48"
        y="28"
        fill="currentColor"
        className="text-foreground"
        fontFamily="inherit"
        fontWeight="700"
        fontSize="20"
      >
        toast
      </text>
    </svg>
  )
}
