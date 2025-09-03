import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface ColorPickerProps {
  brushColor: string;
  backgroundColor: string;
  onChange: (color: string) => void;
  mode: 'brush' | 'background';
  onModeChange: (mode: 'brush' | 'background') => void;
}

const presetColors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ffa500', '#800080', '#ffc0cb', '#a52a2a', '#808080', '#000080', '#008000', '#ff4500'
];

export const ColorPicker = ({ brushColor, backgroundColor, onChange, mode, onModeChange }: ColorPickerProps) => {
  const currentColor = mode === 'brush' ? brushColor : backgroundColor;
  const [hexInput, setHexInput] = useState(currentColor);

  // Update hex input when mode or colors change
  useEffect(() => {
    setHexInput(currentColor);
  }, [currentColor]);

  const handleHexChange = (value: string) => {
    setHexInput(value);
    // Allow partial typing and validate on complete hex
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    } else if (/^#[0-9A-F]{3}$/i.test(value)) {
      // Convert 3-digit hex to 6-digit
      const expandedHex = '#' + value.slice(1).split('').map(char => char + char).join('');
      onChange(expandedHex);
      setHexInput(expandedHex);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-12 h-8 p-0 border-2 relative overflow-hidden"
        >
          <div className="w-full h-full flex">
            <div 
              className="w-1/2 h-full" 
              style={{ backgroundColor: brushColor }}
            />
            <div 
              className="w-1/2 h-full" 
              style={{ backgroundColor: backgroundColor }}
            />
          </div>
          <span className="sr-only">Pick color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-card border border-border shadow-lg z-50">
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-1">
            <Badge 
              variant={mode === 'brush' ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => onModeChange('brush')}
            >
              Brush
            </Badge>
            <Badge 
              variant={mode === 'background' ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => onModeChange('background')}
            >
              Background
            </Badge>
          </div>

          {/* Hex Input */}
          <div className="space-y-2">
            <Label htmlFor="hex">Hex Color</Label>
            <Input
              id="hex"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              className="h-8"
            />
          </div>

          {/* Preset Colors */}
          <div className="space-y-2">
            <Label>Preset Colors</Label>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor);
                    setHexInput(presetColor);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};