interface BrowserFrameProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const BrowserFrame = ({ children, title = 'untitled', className = '' }: BrowserFrameProps) => {
  const isFlexCol = className.includes('flex-col');
  
  return (
    <div className={`bg-card border border-border/50 rounded-lg overflow-hidden ${className}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/30 shrink-0">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        
        {/* Address bar */}
        <div className="flex-1 flex justify-center">
          <div className="px-3 py-1 bg-muted/50 rounded text-xs text-muted-foreground font-mono">
            {title}
          </div>
        </div>
        
        {/* Spacer for symmetry */}
        <div className="w-12" />
      </div>
      
      {/* Content */}
      <div className={`p-4 ${isFlexCol ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
