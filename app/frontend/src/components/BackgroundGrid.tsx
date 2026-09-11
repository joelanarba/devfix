import { useEffect, useRef } from 'react'

export default function BackgroundGrid() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 3
    let currentX = mouseX
    let currentY = mouseY
    let animationFrameId: number

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    const animate = () => {
      // Smooth lerp (linear interpolation) towards mouse
      currentX += (mouseX - currentX) * 0.05
      currentY += (mouseY - currentY) * 0.05

      if (containerRef.current) {
        containerRef.current.style.setProperty('--cursor-x', `${currentX.toFixed(1)}px`)
        containerRef.current.style.setProperty('--cursor-y', `${currentY.toFixed(1)}px`)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="bg-grid-container" ref={containerRef} aria-hidden="true">
      <div className="bg-grid-pattern" />
      <div className="bg-radial-glow" />
      <div className="bg-scanline" />
    </div>
  )
}
