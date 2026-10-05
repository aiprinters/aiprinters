import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightText = false,
}) => {
  const maskId = useId();

  // Proportional sizing configuration
  const config = {
    sm: {
      iconW: 30,
      iconH: 30,
      titleSize: 'text-base',
      subSize: 'text-[7.5px]',
      gap: 'gap-2',
      tracking: 'tracking-[0.16em]',
    },
    md: {
      iconW: 42,
      iconH: 42,
      titleSize: 'text-lg',
      subSize: 'text-[8.5px]',
      gap: 'gap-2.5',
      tracking: 'tracking-[0.18em]',
    },
    lg: {
      iconW: 56,
      iconH: 56,
      titleSize: 'text-2xl',
      subSize: 'text-[10px]',
      gap: 'gap-3',
      tracking: 'tracking-[0.2em]',
    },
    xl: {
      iconW: 76,
      iconH: 76,
      titleSize: 'text-3xl',
      subSize: 'text-xs',
      gap: 'gap-3.5',
      tracking: 'tracking-[0.22em]',
    },
  }[size];

  return (
    <div className={`inline-flex items-center ${config.gap} ${className}`}>
      {/* Official CMYK Geometric Triangle "A" Mark */}
      <svg
        width={config.iconW}
        height={config.iconH}
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105 drop-shadow-sm select-none"
        aria-hidden="true"
      >
        <defs>
          {/* Transparent aperture mask for the inner triangle of letter 'A' */}
          <mask id={maskId}>
            <rect x="0" y="0" width="1000" height="1000" fill="#ffffff" />
            <polygon points="500,455 310,945 690,945" fill="#000000" />
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          {/* 1. Left Navy Leg of 'A' */}
          <polygon
            points="405,220 500,390 500,455 310,945 30,945"
            fill={lightText ? '#38bdf8' : '#0f172a'}
            className="transition-colors duration-200"
          />

          {/* 2. Process Cyan Diamond at Apex */}
          <polygon
            points="500,50 595,220 500,390 405,220"
            fill="#009fe3"
          />

          {/* 3. Process Magenta Segment (Upper Right) */}
          <polygon
            points="595,220 725,465 575,635 500,455 500,390"
            fill="#e5007d"
          />

          {/* 4. Process Yellow Segment (Middle Right) */}
          <polygon
            points="725,465 855,705 705,875 575,635"
            fill="#ffed00"
          />

          {/* 5. Solid Black / Deep Charcoal Segment (Lower Right Foot) */}
          <polygon
            points="855,705 970,945 690,945 705,875"
            fill={lightText ? '#64748b' : '#0a0b0d'}
          />
        </g>
      </svg>

      {/* Brand Wordmark & Tagline */}
      {showText && (
        <div className="flex flex-col justify-center leading-none select-none">
          <div className="flex items-baseline gap-1">
            <span className={`font-outfit font-black tracking-tight ${config.titleSize} text-[#e5007d]`}>
              Ai
            </span>
            <span
              className={`font-outfit font-black tracking-tight ${config.titleSize} ${
                lightText ? 'text-white' : 'text-[#0f172a]'
              }`}
            >
              PRINTERS
            </span>
          </div>
          <span
            className={`font-semibold uppercase mt-0.5 ${config.subSize} ${config.tracking} ${
              lightText ? 'text-slate-300' : 'text-[#475569]'
            }`}
          >
            AWESOME IMAGINATION
          </span>
        </div>
      )}
    </div>
  );
};
export default Logo;
