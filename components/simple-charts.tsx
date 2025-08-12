"use client"

interface PieChartProps {
  data: Array<{ name: string; value: number; percentage: number }>
  colors: string[]
}

export function SimplePieChart({ data, colors }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0

  const radius = 80
  const centerX = 100
  const centerY = 100

  return (
    <div className="flex items-center justify-center h-64">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {data.map((item, index) => {
          const angle = (item.value / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle

          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

          const largeArcFlag = angle > 180 ? 1 : 0

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            "Z",
          ].join(" ")

          currentAngle += angle

          return <path key={index} d={pathData} fill={colors[index % colors.length]} stroke="#000" strokeWidth="1" />
        })}
        <circle cx={centerX} cy={centerY} r="40" fill="#000" />
      </svg>
    </div>
  )
}

interface BarChartProps {
  data: Array<{ name: string; complexity: number; score: number; issues: number }>
}

export function SimpleBarChart({ data }: BarChartProps) {
  const maxComplexity = Math.max(...data.map(d => d.complexity))
  const barWidth = 300 / data.length - 10
  
  return (
    <div className="h-80 flex items-end justify\
