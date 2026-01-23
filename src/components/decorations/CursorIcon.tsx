import { MousePointer2 } from 'lucide-react';

interface CursorIconProps {
  className?: string;
  label?: string;
}

const CursorIcon = ({ className = '', label }: CursorIconProps) => {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <MousePointer2 className="w-4 h-4 text-foreground fill-foreground" />
      {label && (
        <span className="text-xs bg-foreground text-background px-2 py-0.5 rounded-sm font-medium">
          {label}
        </span>
      )}
    </div>
  );
};

export default CursorIcon;
