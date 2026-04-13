import { useEffect, useRef } from 'react'

function MatrixBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const fontSize = 14
    const spacing = 3
    const colWidth = fontSize * spacing

    let columns = Math.floor(canvas.width / colWidth)
    const getMaxRows = () => Math.ceil(canvas.height / fontSize)

    const makeStream = () => {
      const startRow = Math.floor(Math.random() * getMaxRows())
      return {
        y: startRow - Math.floor(Math.random() * 40),
        speed: 0.3 + Math.random() * 0.7,
        acc: 0,
      }
    }

    let streams = Array.from({ length: columns }, makeStream)

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

    const draw = () => {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = 'rgba(250, 250, 250, 0.9)'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < streams.length; i++) {
        const s = streams[i]

        if (s.y >= 0) {
          const char = chars[Math.floor(Math.random() * chars.length)]
          ctx.fillText(char, i * colWidth, s.y * fontSize)
        }

        s.acc += s.speed
        if (s.acc >= 1) {
          s.y += Math.floor(s.acc)
          s.acc -= Math.floor(s.acc)
        }

        if (s.y * fontSize > canvas.height && Math.random() > 0.98) {
          const startRow = Math.floor(Math.random() * getMaxRows())
          s.y = startRow - Math.floor(Math.random() * 40)
          s.speed = 0.3 + Math.random() * 0.7
          s.acc = 0
        }
      }
    }

    const interval = setInterval(draw, 80)

    const onResize = () => {
      resize()
      columns = Math.floor(canvas.width / colWidth)
      streams = Array.from({ length: columns }, makeStream)
    }
    window.addEventListener('resize', onResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.1, zIndex: 0 }}
    />
  )
}

export default MatrixBackground
