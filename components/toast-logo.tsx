export function ToastLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 114"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Toast Inc official logo - Orange circle with white rectangle and "toast" text */}
      {/* Orange circle background */}
      <circle cx="57" cy="57" r="57" fill="#FF6636" />
      {/* White rounded rectangle inside circle */}
      <rect x="27" y="35" width="60" height="44" rx="6" fill="white" />
      {/* Orange horizontal lines on the rectangle */}
      <rect x="35" y="45" width="44" height="4" rx="2" fill="#FF6636" />
      <rect x="35" y="55" width="44" height="4" rx="2" fill="#FF6636" />
      <rect x="35" y="65" width="28" height="4" rx="2" fill="#FF6636" />
      
      {/* Toast text */}
      <g fill="#FF6636">
        {/* t */}
        <path d="M145 35h12v10h15v12h-15v22c0 5 2 7 7 7h8v12h-12c-12 0-15-8-15-18V57h-10V45h10V35z"/>
        {/* o */}
        <path d="M185 69c0-17 12-26 28-26s28 9 28 26-12 26-28 26-28-9-28-26zm42 0c0-10-5-15-14-15s-14 5-14 15 5 15 14 15 14-5 14-15z"/>
        {/* a */}
        <path d="M255 69c0-17 11-26 26-26 8 0 14 3 18 8v-6h14v48c0 18-12 25-30 25-14 0-25-5-28-17h14c2 5 7 7 14 7 10 0 16-5 16-15v-5c-4 5-10 8-18 8-15 0-26-9-26-27zm44 0c0-10-6-15-15-15s-15 5-15 15 6 15 15 15 15-5 15-15z"/>
        {/* s */}
        <path d="M330 80c0-12 10-16 24-18 12-2 14-4 14-8 0-5-4-8-12-8-9 0-13 4-14 9h-13c1-13 11-21 27-21 17 0 26 8 26 22v37h-14v-7c-4 5-10 9-19 9-13 0-19-7-19-15zm38-4v-5c-3 2-7 3-14 5-8 2-11 4-11 9s4 7 10 7c10 0 15-6 15-16z"/>
        {/* t */}
        <path d="M393 35h12v10h15v12h-15v22c0 5 2 7 7 7h8v12h-12c-12 0-15-8-15-18V57h-10V45h10V35z"/>
      </g>
    </svg>
  )
}
