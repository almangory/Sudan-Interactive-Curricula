import React from "react";
import * as Icons from "lucide-react";

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function DynamicIcon({ name, className = "", size = 24 }: DynamicIconProps) {
  // Safe lookup of Lucide Icons
  const IconComponent = (Icons as any)[name];
  
  if (!IconComponent) {
    // Fallback icon if not found
    return <Icons.BookOpen className={className} size={size} />;
  }
  
  return <IconComponent className={className} size={size} />;
}
