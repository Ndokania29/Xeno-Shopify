import { memo } from 'react';

function Logo({ color = '#FFFFFF', size = 32 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path
        d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z"
        fill={color}
        fillOpacity="0.1"
      />
      <path
        d="M23.5 11.5l-1.5-1-4-2.5-2-0.5-2 0.5-4 2.5-1.5 1L7 16l1.5 4.5 1.5 1 4 2.5 2 0.5 2-0.5 4-2.5 1.5-1 1.5-4.5-1.5-4.5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 12v8M12 16h8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 13.5l-4.5-2.5-4.5 2.5v5l4.5 2.5 4.5-2.5v-5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default memo(Logo);