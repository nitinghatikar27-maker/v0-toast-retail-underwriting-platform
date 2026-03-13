export function ToastLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Toast Inc Logo - Orange icon with text */}
      {/* Icon - Orange circle with receipt/document */}
      <circle cx="16" cy="16" r="16" fill="#FF4C00" />
      <rect x="9" y="8" width="14" height="16" rx="2" fill="white" />
      <rect x="11" y="11" width="10" height="2" rx="1" fill="#FF4C00" />
      <rect x="11" y="15" width="10" height="2" rx="1" fill="#FF4C00" />
      <rect x="11" y="19" width="6" height="2" rx="1" fill="#FF4C00" />
      
      {/* Text "toast" */}
      <text
        x="38"
        y="22"
        fill="#FF4C00"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="700"
        fontSize="18"
        letterSpacing="-0.5"
      >
        toast
      </text>
    </svg>
  )
}
