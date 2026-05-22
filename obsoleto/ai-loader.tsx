import { cn } from "../../lib/utils";

export default function AILoader() {
  const digits = ["0", "1", "0", "1", "0", "1", "0", "1", "0"];

  return (
    <div className="flex flex-col items-center justify-center p-8 glass-panel-heavy rounded-2xl border border-ascend-blue/20">
      <div className="matrix-container">
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
        <span className="text-ascend-blue font-orbitron text-sm tracking-[0.3em] uppercase animate-pulse">
          Loading
        </span>
        <h2 className="text-silver/60 font-medium text-lg tracking-wider">
          DESPERTANDO SISTEMA HUNTER...
        </h2>
      </div>
    </div>
  );
}
