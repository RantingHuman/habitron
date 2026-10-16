interface StrengthRingProps {
  // Strength score from 0 to 1
  score: number;
  size?: number;
}

const STROKE_WIDTH = 3;

// A ring that fills with the habit's strength score
const StrengthRing = ({ score, size = 16 }: StrengthRingProps) => {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(score * 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role='img'
      aria-label={`Strength ${percent}%`}
      className='shrink-0 -rotate-90'
    >
      <title>{`Strength ${percent}%`}</title>
      <circle cx={size / 2} cy={size / 2} r={radius} fill='none' strokeWidth={STROKE_WIDTH}
        className='stroke-neutral-400/50 dark:stroke-slate-500' />
      <circle cx={size / 2} cy={size / 2} r={radius} fill='none' strokeWidth={STROKE_WIDTH}
        strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score)} strokeLinecap='round'
        className='stroke-orange-500 dark:stroke-blue-400' />
    </svg>
  );
};

export default StrengthRing;
