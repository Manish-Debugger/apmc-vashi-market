import React from 'react';
import { motion } from 'framer-motion';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  isPositive?: boolean;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 120,
  height = 36,
  color,
  isPositive = true,
}) => {
  if (!data || data.length < 2) return null;

  const strokeColor = color || (isPositive ? '#16a34a' : '#e11d48');
  const fillColor = isPositive ? 'rgba(22, 163, 74, 0.12)' : 'rgba(225, 29, 72, 0.12)';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Generate SVG path coordinates
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((val - min) / range) * innerHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `M ${points.join(' L ')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Shaded Area */}
        <motion.path
          d={areaPath}
          fill={`url(#grad-${strokeColor.replace('#', '')})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Line with Drawing Animation */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Pulsing End Dot */}
        {points.length > 0 && (
          <circle
            cx={parseFloat(points[points.length - 1].split(',')[0])}
            cy={parseFloat(points[points.length - 1].split(',')[1])}
            r="3"
            fill={strokeColor}
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
};
