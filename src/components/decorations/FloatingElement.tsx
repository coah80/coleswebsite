interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

const FloatingElement = ({ children, className = '', animate = true }: FloatingElementProps) => {
  return (
    <div 
      className={`absolute pointer-events-none select-none ${animate ? 'animate-float' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default FloatingElement;
