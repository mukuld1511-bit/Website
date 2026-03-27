"use client";

interface SkeletonProps {
  className?: string;
  variant?:   "text" | "card" | "avatar" | "rect";
  count?:     number;
}

const variantStyles = {
  text:   "h-4 rounded w-3/4",
  card:   "h-48 rounded-2xl",
  avatar: "w-10 h-10 rounded-full",
  rect:   "h-20 rounded-xl",
};

function SkeletonItem({ variant = "text", className = "" }: { variant: string; className: string }) {
  return (
    <div className={`bg-gray-100 animate-pulse ${variantStyles[variant as keyof typeof variantStyles] || variantStyles.text} ${className}`} />
  );
}

export default function Skeleton({ variant = "text", className = "", count = 1 }: SkeletonProps) {
  if (count === 1) return <SkeletonItem variant={variant} className={className} />;
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} variant={variant} className={className} />
      ))}
    </div>
  );
}
