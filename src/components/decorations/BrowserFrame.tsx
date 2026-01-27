interface BrowserFrameProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const BrowserFrame = ({ children, title = 'untitled', className = '' }: BrowserFrameProps) => {
  const isFlexCol = className.includes('flex-col');
  
  return (
    <div className={`bg-card border border-border/50 rounded-md sm:rounded-lg overflow-hidden ${className}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/30 border-b border-border/30 shrink-0">
        {/* Traffic lights */}
        <div className="flex gap-1 sm:gap-1.5">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/70" />
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/70" />
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/70" />
        </div>
        
        {/* Address bar */}
        <div className="flex-1 flex justify-center">
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-muted/50 rounded text-[10px] sm:text-xs text-muted-foreground font-mono truncate max-w-[150px] sm:max-w-none">
            {title}
          </div>
        </div>
        
        {/* Spacer for symmetry */}
        <div className="w-8 sm:w-12" />
      </div>
      
      {/* Content */}
      <div className={`p-2 sm:p-3 md:p-4 ${isFlexCol ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
