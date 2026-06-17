import React from 'react';

interface Stat {
  label: string;
  value: number;
  max: number;
}

interface RadarChartProps {
  stats: Stat[];
  size?: number;
}

export function RadarChart({ stats, size = 300 }: RadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.74;
  const angleStep = (Math.PI * 2) / stats.length;

  // Pontos para as linhas de fundo (grid)
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridLines = levels.map((level) => {
    const points = stats.map((_, i) => {
      const x = center + radius * level * Math.cos(i * angleStep - Math.PI / 2);
      const y = center + radius * level * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    });
    return points.join(' ');
  });

  // Pontos para a área de dados
  const dataPoints = stats.map((stat, i) => {
    const ratio = Math.min(stat.value / stat.max, 1);
    const x = center + radius * ratio * Math.cos(i * angleStep - Math.PI / 2);
    const y = center + radius * ratio * Math.sin(i * angleStep - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');

  // Labels
  const labelRadius = radius * 1.22;
  const labels = stats.map((stat, i) => {
    const x = center + labelRadius * Math.cos(i * angleStep - Math.PI / 2);
    const y = center + labelRadius * Math.sin(i * angleStep - Math.PI / 2);
    return { x, y, label: stat.label };
  });

  return (
    <div className="relative flex max-w-full items-center justify-center" style={{ width: size, height: size, aspectRatio: '1 / 1' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Gradients */}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--royal-purple)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--ascend-blue)" stopOpacity="0.42" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid Lines */}
        {gridLines.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke={i === gridLines.length - 1 ? 'rgba(96,165,250,0.34)' : 'rgba(201,206,214,0.18)'}
            strokeWidth={i === gridLines.length - 1 ? '1.4' : '1'}
          />
        ))}

        {/* Axis Lines */}
        {stats.map((_, i) => {
          const x = center + radius * Math.cos(i * angleStep - Math.PI / 2);
          const y = center + radius * Math.sin(i * angleStep - Math.PI / 2);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(201, 206, 214, 0.17)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Area */}
        <polygon
          points={dataPoints}
          fill="url(#radarGradient)"
          stroke="var(--ascend-blue)"
          strokeWidth="2.5"
          filter="url(#glow)"
          style={{ transition: 'all 0.5s ease-in-out' }}
        />

        {/* Data Points */}
        {stats.map((stat, i) => {
          const ratio = Math.min(stat.value / stat.max, 1);
          const x = center + radius * ratio * Math.cos(i * angleStep - Math.PI / 2);
          const y = center + radius * ratio * Math.sin(i * angleStep - Math.PI / 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#E2E8F0"
              stroke="var(--ascend-blue)"
              strokeWidth="1.5"
              filter="url(#glow)"
              style={{ transition: 'all 0.5s ease-in-out' }}
            />
          );
        })}

        {/* Labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#CBD5E1"
            fontSize="11"
            fontWeight="800"
            style={{ fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase' }}
          >
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
