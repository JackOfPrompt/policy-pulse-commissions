import { ImageIcon } from "lucide-react";
import { useLOBs } from "@/hooks/useLOBs";

interface LOBIconProps {
  iconPath?: string;
  lobName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LOBIcon = ({ iconPath, lobName, size = 'md', className = '' }: LOBIconProps) => {
  const { getLOBIcon } = useLOBs();
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const iconUrl = getLOBIcon(iconPath);

  if (iconUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <img
          src={iconUrl}
          alt={`${lobName} icon`}
          className={`${sizeClasses[size]} object-cover rounded`}
          onError={(e) => {
            // Fallback to default icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
        <div 
          className={`${sizeClasses[size]} flex items-center justify-center bg-muted rounded absolute inset-0`}
          style={{ display: 'none' }}
        >
          <ImageIcon className="w-1/2 h-1/2 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center bg-muted rounded ${className}`}>
      <ImageIcon className="w-1/2 h-1/2 text-muted-foreground" />
    </div>
  );
};

export default LOBIcon;