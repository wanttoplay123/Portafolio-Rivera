import { useRef } from 'react'

/**
 * Wraps children in a perspective container that tilts toward the pointer.
 * Pure CSS transforms so it stays cheap next to the WebGL background.
 */
export default function Tilt({ children, max = 12, scale = 1.03, className = '', ...rest }) {
  const ref = useRef(null)
  const raf = useRef(0)

  const apply = (rx, ry, s) => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`
      }
    })
  }

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    apply(-py * max, px * max, scale)
  }

  const onLeave = () => apply(0, 0, 1)

  return (
    <div className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave} {...rest}>
      <div className="tilt-inner" ref={ref}>
        {children}
      </div>
    </div>
  )
}
