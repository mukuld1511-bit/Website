"use client";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "outline";

interface BadgeProps {
  children:   React.ReactNode;
  variant?:   BadgeVariant;
  className?: string;
  size?:      "xs" | "sm";
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  "bg-gray-100 text-gray-600 border-gray-200",
  primary:  "bg-[#5B4BDB]/10 text-[#5B4BDB] border-[#5B4BDB]/20",
  success:  "bg-green-50 text-green-700 border-green-200",
  warning:  "bg-amber-50 text-amber-700 border-amber-200",
  error:    "bg-red-50 text-red-700 border-red-200",
  outline:  "bg-white text-gray-700 border-gray-200",
};

const sizeStyles = {
  xs: "px-1.5 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-xs",
};

export default function Badge({ children, variant = "default", className = "", size = "sm" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-bold border rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}
