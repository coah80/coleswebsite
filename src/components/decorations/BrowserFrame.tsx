interface BrowserFrameProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const BrowserFrame = ({ children, title = 'untitled', className = '' }: BrowserFrameProps) => {
  const isFlexCol = className.includes('flex-col');

  return (
    <div className={`bg-ctp-surface0/40 border border-ctp-surface1/50 rounded-2xl overflow-hidden ${className}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-ctp-mantle/60 border-b border-ctp-text/5 shrink-0">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-ctp-red/70" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-ctp-yellow/70" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-ctp-green/70" />
        </div>

        {/* Address bar */}
        <div className="flex-1 flex justify-center">
          <div className="px-3 py-0.5 bg-ctp-surface0/60 rounded-lg text-[10px] sm:text-xs text-ctp-overlay1 font-data truncate max-w-[180px] sm:max-w-none">
            {title}
          </div>
        </div>

        <div className="w-10 sm:w-12" />
      </div>

      {/* Content */}
      <div className={`p-3 sm:p-4 ${isFlexCol ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
