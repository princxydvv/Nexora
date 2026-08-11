'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  vx: number
  vy: number
  targetX?: number
  targetY?: number
}

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Star field
    const stars: Particle[] = []
    const particleCount = 100

    for (let i = 0; i < particleCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        opacity: Math.random() * 0.5 + 0.1,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
      })
    }

    // Floating nebula blobs
    const nebulas = [
      { x: canvas.width * 0.2, y: canvas.height * 0.3, size: 300, opacity: 0.05 },
      { x: canvas.width * 0.8, y: canvas.height * 0.6, size: 400, opacity: 0.04 },
      { x: canvas.width * 0.5, y: canvas.height * 0.1, size: 350, opacity: 0.03 },
    ]

    let mouseX = 0
    let mouseY = 0
    const mouseParticles: Particle[] = []

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    })

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(5, 5, 5, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update stars
      stars.forEach((star) => {
        // Random flicker
        star.opacity += (Math.random() - 0.5) * 0.02
        star.opacity = Math.max(0.05, Math.min(0.6, star.opacity))

        // Draw star
        ctx.fillStyle = `rgba(245, 245, 245, ${star.opacity})`
        ctx.fillRect(star.x, star.y, star.size, star.size)

        // Slow movement
        star.x += star.vx
        star.y += star.vy

        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0
      })

      // Draw nebulas
      nebulas.forEach((nebula) => {
        const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.size)
        gradient.addColorStop(0, `rgba(137, 170, 204, ${nebula.opacity})`)
        gradient.addColorStop(0.5, `rgba(78, 133, 191, ${nebula.opacity * 0.5})`)
        gradient.addColorStop(1, 'rgba(78, 133, 191, 0)')

        ctx.fillStyle = gradient
        ctx.fillRect(nebula.x - nebula.size, nebula.y - nebula.size, nebula.size * 2, nebula.size * 2)
      })

      // Animate nebulas
      nebulas.forEach((nebula, i) => {
        nebula.x += Math.sin(Date.now() * 0.0001 + i) * 0.05
        nebula.y += Math.cos(Date.now() * 0.00008 + i) * 0.05
      })

      // Mouse-reactive particles
      if (Math.random() > 0.95) {
        const angle = Math.random() * Math.PI * 2
        mouseParticles.push({
          x: mouseX + Math.cos(angle) * 20,
          y: mouseY + Math.sin(angle) * 20,
          size: Math.random() * 1,
          opacity: 0.3,
          vx: Math.cos(angle) * 0.5,
          vy: Math.sin(angle) * 0.5,
        })
      }

      mouseParticles.forEach((p, i) => {
        p.opacity -= 0.01
        p.x += p.vx
        p.y += p.vy

        ctx.fillStyle = `rgba(137, 170, 204, ${p.opacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (p.opacity <= 0) {
          mouseParticles.splice(i, 1)
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', () => {})
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none bg-background"
      style={{ zIndex: 0 }}
    />
  )
}
