export const GithubIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5 3.3 9.3 7.8 10.8.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6a11.4 11.4 0 0 0 7.8-10.8C23.4 5.6 18.3.5 12 .5z" />
  </svg>
)

export const LinkedinIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.75-1.95C20.4 8.75 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.3-2.02-3.3-2.02 0-2.33 1.57-2.33 3.2V21H9z" />
  </svg>
)

export const MailIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
    <path d="m3 6 9 6.5L21 6" />
  </svg>
)

export const PhoneIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
    <path d="M4 4.5h4l1.5 4.5-2.2 1.6a12.5 12.5 0 0 0 6.1 6.1l1.6-2.2 4.5 1.5v4c0 .8-.7 1.5-1.5 1.5C10.2 21.5 2.5 13.8 2.5 6 2.5 5.2 3.2 4.5 4 4.5z" />
  </svg>
)

export const PinIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
    <path d="M12 22s7-6.2 7-11.5A7 7 0 0 0 5 10.5C5 15.8 12 22 12 22z" />
    <circle cx="12" cy="10.3" r="2.6" />
  </svg>
)

export const StarDivider = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 200 12" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M0 6h80" />
    <path d="M120 6h80" />
    <path
      d="m100 0 2.2 3.8L106 6l-3.8 2.2L100 12l-2.2-3.8L94 6l3.8-2.2z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
)
