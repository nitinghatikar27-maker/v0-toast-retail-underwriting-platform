export function ToastLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Toast Inc Logo - Rounded square with document/page icon */}
      {/* Outer rounded rectangle */}
      <rect x="0" y="2" width="24" height="24" rx="5" fill="#FF4C29" />
      {/* Inner white document shape with folded corner */}
      <path 
        d="M6 7C6 6.44772 6.44772 6 7 6H14L18 10V21C18 21.5523 17.5523 22 17 22H7C6.44772 22 6 21.5523 6 21V7Z" 
        fill="white"
      />
      {/* Folded corner */}
      <path d="M14 6L18 10H15C14.4477 10 14 9.55228 14 9V6Z" fill="#FFB8A8" />
      {/* Document lines */}
      <rect x="8" y="12" width="8" height="1.5" rx="0.75" fill="#FF4C29" />
      <rect x="8" y="15" width="8" height="1.5" rx="0.75" fill="#FF4C29" />
      <rect x="8" y="18" width="5" height="1.5" rx="0.75" fill="#FF4C29" />
      
      {/* Text "toast" */}
      <text
        x="30"
        y="19"
        fill="#FF4C29"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="600"
        fontSize="15"
      >
        toast
      </text>
    </svg>
  )
}
