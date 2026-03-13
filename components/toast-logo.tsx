export function ToastLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Toast Inc Logo - Orange circle with 3 horizontal lines */}
      <circle cx="16" cy="16" r="16" fill="#FF4419" />
      {/* Three horizontal white lines (hamburger menu style) */}
      <rect x="7" y="9" width="18" height="3" rx="1.5" fill="white" />
      <rect x="7" y="14.5" width="18" height="3" rx="1.5" fill="white" />
      <rect x="7" y="20" width="18" height="3" rx="1.5" fill="white" />
      
      {/* Text "toast" */}
      <text
        x="38"
        y="22"
        fill="#FF4419"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="600"
        fontSize="17"
      >
        toast
      </text>
    </svg>
  )
}
