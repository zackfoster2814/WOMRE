import React, { useRef, useState, useEffect } from 'react'
import Race from 'src/abstract/interfaces/race.interface'
import { Subrace } from 'src/abstract/types/subrace.type'

// const sections = [
//   { id: '01', name: 'Goblin', weight: 5, color: '#CC4C4C' },
//   { id: '02', name: 'Gnome', weight: 5, color: '#E6A857' },
//   { id: '03', name: 'Human', weight: 5, color: '#E6E68A' },
//   { id: '04', name: 'Dwarf', weight: 5, color: '#5FAF5F' },
//   { id: '05', name: 'Merfolk', weight: 4, color: '#80D4D4' }
// ]

const colors = ['#CC4C4C', '#E6A857', '#E6E68A', '#5FAF5F', '#80D4D4']

const GoblinHordes: Subrace[] = [
  { id: 1, name: '1', trait: 'Nhận Archetype "Him"', weight: 2 },
  { id: 1, name: '36', trait: 'Nhận -1 All Stats', weight: 20 },
  { id: 1, name: '1001', trait: 'Bro là 1 con Goblin 💀', weight: 40 },
  { id: 1, name: '5000', trait: 'Nhận 1 Gear', weight: 20 },
  {
    id: 1,
    name: '10000',
    trait: 'Nhận +1 Strength, +1 Durability và +1 Martial Arts',
    weight: 10
  },
  {
    id: 1,
    name: '50000',
    trait: 'Nhận +2 Strength, +2 Durability và +1 Martial Arts',
    weight: 5
  },
  { id: 1, name: '50000+', trait: 'Nhận +1 all stats', weight: 3 }
]

const HumanSkins: Subrace[] = [
  { id: 1, name: 'Trắng', trait: 'Nhận -1 IQ, +1 BIQ', weight: 20 },
  { id: 1, name: 'Vàng', trait: 'Nhận +1 IQ', weight: 40 },
  { id: 1, name: 'Đen', trait: 'Nhận +1 Dura', weight: 40 }
]

export default function Wheel() {
  const goblinHordesWheelRef = useRef<HTMLCanvasElement | null>(null)
  const humanSkinsWheelRef = useRef<HTMLCanvasElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rollSoundRef = useRef<HTMLAudioElement | null>(null)

  const [angle, setAngle] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const [goblinWheelAngle, setGoblinWheelAngle] = useState<number>(0)
  const [isGoblinSpinning, setIsGoblinSpinning] = useState(false)
  const [goblinResult, setGoblinResult] = useState<Race | Subrace | null>(null)

  const [humanWheelAngle, setHumanWheelAngle] = useState<number>(0)
  const [isHumanSpinning, setIsHumanSpinning] = useState(false)
  const [humanResult, setHumanResult] = useState<Race | Subrace | null>(null)

  const radius = 200

  useEffect(() => {
    rollSoundRef.current = new Audio('/assets/no-story-70330.mp3')
  }, [])

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    currentAngle: number,
    data: Race[] | Subrace[]
  ) => {
    const totalWeight = data.reduce((sum, sec) => sum + sec.weight, 0)
    let startAngle = 0

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.save()
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)
    ctx.rotate((currentAngle * Math.PI) / 180)

    data.forEach((section, index) => {
      const angleStep = (section.weight / totalWeight) * 2 * Math.PI
      const endAngle = startAngle + angleStep

      // fill sector
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = colors[index % colors.length]
      ctx.fill()

      // text
      ctx.save()
      ctx.fillStyle = '#000'
      ctx.translate(
        Math.cos((startAngle + endAngle) / 2) * radius * 0.6,
        Math.sin((startAngle + endAngle) / 2) * radius * 0.6
      )
      ctx.rotate((startAngle + endAngle) / 2)
      ctx.textAlign = 'center'
      ctx.font = '16px Arial'
      ctx.fillText(section.name, 0, 0)
      ctx.restore()

      startAngle = endAngle
    })

    ctx.restore()
  }

  useEffect(() => {
    // const canvas = canvasRef.current
    // if (!canvas) return
    // const ctx = canvas.getContext('2d')
    // if (!ctx) return
    // drawWheel(ctx, angle)

    const goblinHordesCanvas = goblinHordesWheelRef.current

    if (goblinHordesCanvas) {
      const ctx = goblinHordesCanvas.getContext('2d')
      if (ctx) drawWheel(ctx, goblinWheelAngle, GoblinHordes)
    }
  }, [goblinWheelAngle])

  useEffect(() => {
    const humanSkinsCanvas = humanSkinsWheelRef.current

    if (humanSkinsCanvas) {
      const ctx = humanSkinsCanvas.getContext('2d')
      if (ctx) drawWheel(ctx, humanWheelAngle, HumanSkins)
    }
  }, [humanWheelAngle])

  const spin = (
    angle: number,
    data: Race[] | Subrace[],
    isSpinning: boolean,
    setIsSpinning: React.Dispatch<React.SetStateAction<boolean>>,
    setResult: React.Dispatch<React.SetStateAction<Race | Subrace | null>>,
    setAngle: React.Dispatch<React.SetStateAction<number>>
  ) => {
    if (isSpinning) return

    setIsSpinning(true)
    setResult(null)

    const randomAngle = Math.random() * 360
    const extraRotations = 5 * 360
    const finalAngle = angle + extraRotations + randomAngle

    let start: number | null = null
    const duration = 3500 + Math.random() * 2000 // 3.5 → 5.5 s
    let lastSectionIndex = -1

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4) // quartOut easing
      const current = angle + eased * (finalAngle - angle)
      setAngle(current)

      // phát âm thanh khi qua section mới
      const totalWeight = data.reduce((s, sec) => s + sec.weight, 0)
      let cumulative = 0
      const normalizedAngle = (360 - (current % 360)) % 360
      let currentSectionIndex = -1
      for (let i = 0; i < data.length; i++) {
        const step = (data[i].weight / totalWeight) * 360
        cumulative += step
        if (normalizedAngle <= cumulative) {
          currentSectionIndex = i
          break
        }
      }
      if (currentSectionIndex !== -1 && currentSectionIndex !== lastSectionIndex) {
        rollSoundRef.current?.play()
        lastSectionIndex = currentSectionIndex
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // xác định kết quả
        let chosen: Race | Subrace | null = null
        cumulative = 0
        for (const section of data) {
          const step = (section.weight / totalWeight) * 360
          cumulative += step
          if (normalizedAngle <= cumulative) {
            chosen = section
            break
          }
        }
        setResult(chosen)
        setIsSpinning(false)
        setAngle(finalAngle % 360)
      }
    }

    requestAnimationFrame(animate)
  }

  return (
    <div className="w-screen h-screen flex flex-row items-center justify-center bg-gray-900 text-white gap-6">
      <div className="items-center justify-center flex flex-col">
        <h1 className="font-bold text-2xl">Goblin Horde</h1>
        <canvas ref={goblinHordesWheelRef} width={500} height={500} />
        <button
          onClick={() =>
            spin(
              goblinWheelAngle,
              GoblinHordes,
              isGoblinSpinning,
              setIsGoblinSpinning,
              setGoblinResult,
              setGoblinWheelAngle
            )
          }
          disabled={isGoblinSpinning}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold shadow-lg disabled:opacity-50"
        >
          {isGoblinSpinning ? 'Spinning...' : 'Spin'}
        </button>
        {goblinResult && (
          <div className="text-2xl font-bold text-orange-400">Result: {goblinResult.trait}</div>
        )}
      </div>
      <div className="items-center justify-center flex flex-col">
        <h1 className="font-bold text-2xl">Human Skin</h1>
        <canvas ref={humanSkinsWheelRef} width={500} height={500} />
        <button
          onClick={() =>
            spin(
              humanWheelAngle,
              HumanSkins,
              isHumanSpinning,
              setIsHumanSpinning,
              setHumanResult,
              setHumanWheelAngle
            )
          }
          disabled={isHumanSpinning}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold shadow-lg disabled:opacity-50"
        >
          {isHumanSpinning ? 'Spinning...' : 'Spin'}
        </button>
        {humanResult && (
          <div className="text-2xl font-bold text-orange-400">Result: {humanResult.trait}</div>
        )}
      </div>
    </div>
  )
}
