export function ToastLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Toast icon - document/page shape with folded corner */}
      <path
        d="M4 4C4 2.89543 4.89543 2 6 2H18L24 8V28C24 29.1046 23.1046 30 22 30H6C4.89543 30 4 29.1046 4 28V4Z"
        fill="#FF6347"
      />
      <path
        d="M18 2L24 8H20C18.8954 8 18 7.10457 18 6V2Z"
        fill="#E5533A"
      />
      {/* Text "toast" */}
      <text
        x="30"
        y="22"
        fill="#FF6347"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="16"
      >
        toast
      </text>
    </svg>
  )
}
