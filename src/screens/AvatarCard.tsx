interface AvatarCardProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  glowing?: boolean;
  color?: 'crimson' | 'emerald' | 'amber';
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
};

const colorMap = {
  crimson: { bg: '#e94560', shadow: '#e94560' },
  emerald: { bg: '#10b981', shadow: '#10b981' },
  amber: { bg: '#f59e0b', shadow: '#f59e0b' },
};

export default function AvatarCard({ initials, size = 'md', glowing = false, color = 'crimson' }: AvatarCardProps) {
  const { bg, shadow } = colorMap[color];
  return (
    <div
      className={`${sizeMap[size]} rounded-xl flex items-center justify-center font-black text-white border-2 transition-all duration-300 shrink-0`}
      style={{
        background: `${bg}20`,
        borderColor: `${bg}60`,
        boxShadow: glowing ? `0 0 16px ${shadow}80, 0 0 32px ${shadow}40` : 'none',
      }}
    >
      {initials}
    </div>
  );
}
