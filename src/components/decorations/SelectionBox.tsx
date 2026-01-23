interface SelectionBoxProps {
  className?: string;
  color?: string;
}

const SelectionBox = ({ className = '', color = 'accent' }: SelectionBoxProps) => {
  return (
    <div 
      className={`absolute pointer-events-none ${className}`}
      style={{
        background: `hsl(var(--${color}) / 0.2)`,
        border: `1px solid hsl(var(--${color}) / 0.5)`,
        borderRadius: '2px'
      }}
    />
  );
};

export default SelectionBox;
