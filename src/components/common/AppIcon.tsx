import { icons } from 'lucide-react'

interface AppIconProps {
  name: string
  size?: number
  color?: string
  className?: string
  strokeWidth?: number
}

export function AppIcon({ name, size = 20, color, className, strokeWidth }: AppIconProps) {
  const IconComponent = icons[name as keyof typeof icons]
  if (!IconComponent) return <span>{name}</span>
  return <IconComponent size={size} color={color} className={className} strokeWidth={strokeWidth} />
}
