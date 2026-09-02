import React from 'react';

export const CornerSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    width="12"
    height="12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 3 линии: от (16,2) влево до (6,2), скос в (2,6), вниз до (2,16) */}
    <path
      d="M16 2H6L2 6V16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);