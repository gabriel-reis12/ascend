import type { InputHTMLAttributes } from 'react';
import { useState } from 'react';

interface NeonCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

const VIOLET = '#7C3AED';
const VIOLET_DARK = '#6D28D9';
const VIOLET_LIGHT = '#A78BFA';

export function NeonCheckbox({
  label,
  className = '',
  checked: controlledChecked,
  defaultChecked,
  onChange,
  ...props
}: NeonCheckboxProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isControlled = controlledChecked !== undefined;
  const isChecked = isControlled ? controlledChecked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalChecked(e.target.checked);
    onChange?.(e);
  };

  const style = {
    '--primary': VIOLET,
    '--primary-dark': VIOLET_DARK,
    '--primary-light': VIOLET_LIGHT,
    '--size': '28px',
  } as React.CSSProperties;

  const xPositions = ['25px', '-25px', '25px', '-25px', '35px', '-35px', '0px', '0px', '20px', '-20px', '30px', '-30px'];
  const yPositions = ['-25px', '-25px', '25px', '25px', '0px', '0px', '35px', '-35px', '-30px', '30px', '20px', '-20px'];

  return (
    <label
      className={`relative inline-flex items-center gap-2 cursor-pointer ${className}`}
      style={style}
    >
      <input type="checkbox" className="hidden" checked={isChecked} onChange={handleChange} {...props} />

      <div className="relative" style={{ width: 'var(--size)', height: 'var(--size)' }}>
        {/* Box */}
        <div className={`absolute inset-0 rounded border-2 transition-all duration-300 ${
          isChecked
            ? 'border-[var(--primary)] bg-[rgba(124,58,237,0.12)]'
            : 'border-[var(--primary-dark)] bg-black/60'
        }`}>
          {/* Checkmark */}
          <div className="absolute inset-[2px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className={`w-4/5 h-4/5 fill-none stroke-[var(--primary)] stroke-[3] [stroke-linecap:round] [stroke-linejoin:round] [stroke-dasharray:40] origin-center transition-all duration-350 ease-out ${
              isChecked ? '[stroke-dashoffset:0] scale-110' : '[stroke-dashoffset:40]'
            }`}>
              <path d="M3,12.5l7,7L21,5" />
            </svg>
          </div>

          {/* Glow */}
          <div className={`absolute -inset-0.5 rounded bg-[var(--primary)] blur-md transition-opacity duration-300 ${isChecked ? 'opacity-15' : 'opacity-0'}`} />

          {/* Animated borders */}
          <div className="absolute inset-0 rounded overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`absolute bg-[var(--primary)] transition-opacity duration-300 ${isChecked ? 'opacity-100' : 'opacity-0'} ${
                i === 0 ? 'h-px w-10 top-0 left-[-100%] [animation:borderFlow1_2s_linear_infinite]' :
                i === 1 ? 'w-px h-10 top-[-100%] right-0 [animation:borderFlow2_2s_linear_infinite]' :
                i === 2 ? 'h-px w-10 bottom-0 right-[-100%] [animation:borderFlow3_2s_linear_infinite]' :
                          'w-px h-10 bottom-[-100%] left-0 [animation:borderFlow4_2s_linear_infinite]'
              }`} />
            ))}
          </div>
        </div>

        {/* Particle effects */}
        <div className="absolute inset-0">
          {xPositions.map((x, i) => (
            <span key={i} className={`absolute w-1 h-1 bg-[var(--primary)] rounded-full pointer-events-none top-1/2 left-1/2 shadow-[0_0_6px_var(--primary)] ${
              isChecked ? '[animation:particleExplosion_0.6s_ease-out_forwards]' : 'opacity-0'
            }`} style={{ '--x': x, '--y': yPositions[i] } as React.CSSProperties} />
          ))}
        </div>

        {/* Ring pulses */}
        <div className="absolute -inset-4 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`absolute inset-0 rounded-full border border-[var(--primary)] scale-0 ${
              isChecked ? '[animation:ringPulse_0.6s_ease-out_forwards]' : 'opacity-0'
            }`} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        {/* Spark flashes */}
        <div className="absolute inset-0">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`absolute w-4 h-px bg-gradient-to-r from-[var(--primary)] to-transparent top-1/2 left-1/2 ${
              isChecked ? '[animation:sparkFlash_0.6s_ease-out_forwards]' : 'opacity-0'
            }`} style={{ '--r': `${i * 90}deg` } as React.CSSProperties} />
          ))}
        </div>
      </div>

      {label && <span className="text-sm text-[#E2E8F0]">{label}</span>}
    </label>
  );
}
