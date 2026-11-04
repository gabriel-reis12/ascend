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
  const reactId = React.useId();
  const center = size / 2;
  const radius = (size / 2) * 0.72;
  const angleStep = (Math.PI * 2) / stats.length;

  // Pontos para as linhas de fundo (grid holográfico em 5 níveis)
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridLines = levels.map((level) => {
    const points = stats.map((_, i) => {
      const x = center + radius * level * Math.cos(i * angleStep - Math.PI / 2);
      const y = center + radius * level * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    });
    return points.join(' ');
  });

  // Pontos para a área de dados real (preservando a escala original)
  const dataPoints = stats
    .map((stat, i) => {
      const ratio = Math.min(stat.value / stat.max, 1);
      const x = center + radius * ratio * Math.cos(i * angleStep - Math.PI / 2);
      const y = center + radius * ratio * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Rótulos externos dos eixos
  const labelRadius = radius * 1.22;
  const labels = stats.map((stat, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    const cosine = Math.cos(angle);
    const textAnchor: 'start' | 'middle' | 'end' =
      cosine > 0.35 ? 'start' : cosine < -0.35 ? 'end' : 'middle';
    return { x, y, label: stat.label, value: stat.value, textAnchor };
  });

  const fillGradId = `hud-radar-fill-${reactId}`;
  const strokeGradId = `hud-radar-stroke-${reactId}`;
  const glowFilterId = `hud-radar-glow-${reactId}`;

  return (
    <div
      className="relative flex w-full max-w-full items-center justify-center select-none"
      style={{ maxWidth: size, aspectRatio: '1 / 1' }}
      role="img"
      aria-label={`Radar com sete atributos: ${stats
        .map((stat) => `${stat.label} ${stat.value}`)
        .join(', ')}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={fillGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.40" />
          </linearGradient>
          <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Círculo de Halo Central Holográfico */}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.98}
          fill="rgba(0, 240, 255, 0.025)"
          stroke="rgba(0, 240, 255, 0.08)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        {/* Polígonos da Malha (Grid Lines) */}
        {gridLines.map((points, i) => {
          const isOuter = i === gridLines.length - 1;
          const isMid = i === 2;
          return (
            <polygon
              key={i}
              points={points}
              fill={isOuter ? 'rgba(11, 13, 20, 0.35)' : 'none'}
              stroke={
                isOuter
                  ? 'rgba(0, 240, 255, 0.38)'
                  : isMid
                    ? 'rgba(168, 85, 247, 0.24)'
                    : 'rgba(148, 163, 184, 0.14)'
              }
              strokeWidth={isOuter ? '1.5' : '1'}
            />
          );
        })}

        {/* Eixos Radiais e Vértices Externos */}
        {stats.map((_, i) => {
          const x = center + radius * Math.cos(i * angleStep - Math.PI / 2);
          const y = center + radius * Math.sin(i * angleStep - Math.PI / 2);
          return (
            <g key={i}>
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(0, 240, 255, 0.18)"
                strokeWidth="1"
              />
              <circle
                cx={x}
                cy={y}
                r="2.75"
                fill="#0A0C12"
                stroke="#00F0FF"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {/* Área de Dados Holográfica */}
        <polygon
          points={dataPoints}
          fill={`url(#${fillGradId})`}
          stroke={`url(#${strokeGradId})`}
          strokeWidth="2.25"
          filter={`url(#${glowFilterId})`}
          style={{ transition: 'all 0.45s ease-out' }}
        />

        {/* Vértices dos Valores Atuais */}
        {stats.map((stat, i) => {
          const ratio = Math.min(stat.value / stat.max, 1);
          const x = center + radius * ratio * Math.cos(i * angleStep - Math.PI / 2);
          const y = center + radius * ratio * Math.sin(i * angleStep - Math.PI / 2);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="5.5"
                fill="rgba(0, 240, 255, 0.18)"
                style={{ transition: 'all 0.45s ease-out' }}
              />
              <circle
                cx={x}
                cy={y}
                r="3.25"
                fill="#F8FAFC"
                stroke="#00F0FF"
                strokeWidth="1.5"
                style={{ transition: 'all 0.45s ease-out' }}
              />
            </g>
          );
        })}

        {/* Rótulos e Valores de Cada Atributo */}
        {labels.map((label, i) => (
          <g key={i}>
            <text
              x={label.x}
              y={label.y - 6}
              textAnchor={label.textAnchor}
              dominantBaseline="middle"
              fill="#E2E8F0"
              fontSize="11"
              fontWeight="800"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {label.label}
            </text>
            <text
              x={label.x}
              y={label.y + 8}
              textAnchor={label.textAnchor}
              dominantBaseline="middle"
              fill="#00F0FF"
              fontSize="10"
              fontWeight="800"
              style={{
                fontFamily: 'Orbitron, sans-serif',
              }}
            >
              {label.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
