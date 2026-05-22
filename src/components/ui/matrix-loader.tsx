import React from 'react'

export function MatrixLoader() {
  const digits = ["0", "1", "0", "1", "0", "1", "0", "1", "0"];

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-transparent">
      <div className="matrix-container !m-0">
        <div className="matrix-glow" />
        {digits.map((digit, i) => (
          <div
            key={i}
            className="matrix-digit"
            style={{ animationDelay: `${0.1 + i * 0.2}s` }}
          >
            {digit}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex flex-col items-center gap-2">
        <span className="text-royal-purple font-orbitron text-[10px] tracking-[0.4em] uppercase animate-pulse">
          Loading
        </span>
        <h2 className="text-silver/60 font-medium text-lg tracking-[0.15em] whitespace-nowrap">
          DESPERTANDO SISTEMA HUNTER...
        </h2>
      </div>
    </div>
  );
}
