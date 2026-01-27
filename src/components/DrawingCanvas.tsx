import { useState, useRef, useEffect, useCallback } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers, 
  Send,
  Paintbrush,
  PaintBucket,
  ChevronUp,
  ChevronDown,
  Settings2
} from 'lucide-react';

const CANVAS_WIDTH = 960;  // 16:9 aspect ratio
const CANVAS_HEIGHT = 540;
const HISTORY_LIMIT = 50;

// Preset colors
const BRUSH_COLORS = [
  '#000000', '#ffffff', '#ff6b6b', '#ffa94d', '#ffd43b', 
  '#69db7c', '#4dabf7', '#9775fa', '#f783ac', '#868e96'
];

const BG_COLORS = [
  '#ffffff', '#1a1a1a', '#f8f9fa', '#fff3bf', '#d3f9d8',
  '#d0ebff', '#e5dbff', '#ffe3e3', '#212529', '#343a40'
];

type LayerData = {
  id: number;
  name: string;
  visible: boolean;
  canvas: HTMLCanvasElement | null;
};

type HistoryState = {
  layers: ImageData[];
  backgroundColor: string;
};

interface DrawingCanvasProps {
  onSubmit: (dataUrl: string, caption: string) => Promise<void>;
  isSubmitting: boolean;
  cooldownTimeLeft: number;
  formatCooldownTime: (seconds: number) => string;
}

const DrawingCanvas = ({ onSubmit, isSubmitting, cooldownTimeLeft, formatCooldownTime }: DrawingCanvasProps) => {
  // Layer state
  const [layers, setLayers] = useState<LayerData[]>([
    { id: 1, name: 'Layer 1', visible: true, canvas: null },
    { id: 2, name: 'Layer 2', visible: true, canvas: null },
    { id: 3, name: 'Layer 3', visible: true, canvas: null },
  ]);
  const [activeLayer, setActiveLayer] = useState(0); // Index
  
  // Drawing state
  const [brushColor, setBrushColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [colorMode, setColorMode] = useState<'brush' | 'background'>('brush');
  const [caption, setCaption] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState(true);
  const [hasUserToggledToolbar, setHasUserToggledToolbar] = useState(false);
  
  // History state
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Refs
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([null, null, null]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  // Detect landscape orientation and auto-collapse toolbar
  useEffect(() => {
    const checkLandscape = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      const isMobileSize = window.innerHeight < 600;
      const landscape = aspectRatio > 1.3 && isMobileSize;
      setIsLandscape(landscape);
      // Auto-collapse toolbar in landscape if user hasn't manually toggled
      if (!hasUserToggledToolbar) {
        setToolbarExpanded(!landscape);
      }
    };
    
    checkLandscape();
    window.addEventListener('resize', checkLandscape);
    window.addEventListener('orientationchange', checkLandscape);
    
    return () => {
      window.removeEventListener('resize', checkLandscape);
      window.removeEventListener('orientationchange', checkLandscape);
    };
  }, [hasUserToggledToolbar]);

  // Initialize layer canvases
  useEffect(() => {
    layerCanvasRefs.current = layerCanvasRefs.current.map((existing, i) => {
      if (existing) return existing;
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      return canvas;
    });
    
    setLayers(prev => prev.map((layer, i) => ({
      ...layer,
      canvas: layerCanvasRefs.current[i]
    })));
    
    // Initial render
    renderToDisplay();
    saveToHistory();
  }, []);

  // Render all layers to display canvas
  const renderToDisplay = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;
    
    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw each visible layer
    layers.forEach((layer, index) => {
      if (layer.visible && layerCanvasRefs.current[index]) {
        ctx.drawImage(layerCanvasRefs.current[index]!, 0, 0);
      }
    });
  }, [backgroundColor, layers]);

  // Re-render when layers or background change
  useEffect(() => {
    renderToDisplay();
  }, [renderToDisplay, backgroundColor]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const layerSnapshots: ImageData[] = [];
    
    layerCanvasRefs.current.forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          layerSnapshots.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
        }
      }
    });
    
    const newState: HistoryState = {
      layers: layerSnapshots,
      backgroundColor
    };
    
    setHistory(prev => {
      // Remove any redo states
      const trimmed = prev.slice(0, historyIndex + 1);
      // Add new state
      const updated = [...trimmed, newState];
      // Limit history
      if (updated.length > HISTORY_LIMIT) {
        return updated.slice(updated.length - HISTORY_LIMIT);
      }
      return updated;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, HISTORY_LIMIT - 1));
  }, [backgroundColor, historyIndex]);

  // Restore from history state
  const restoreFromHistory = useCallback((state: HistoryState) => {
    state.layers.forEach((imageData, index) => {
      const canvas = layerCanvasRefs.current[index];
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    });
    setBackgroundColor(state.backgroundColor);
    renderToDisplay();
  }, [renderToDisplay]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreFromHistory(history[newIndex]);
    }
  }, [historyIndex, history, restoreFromHistory]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreFromHistory(history[newIndex]);
    }
  }, [historyIndex, history, restoreFromHistory]);

  // Get relative position
  const getRelativePosition = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }, []);

  // Begin stroke
  const beginStroke = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    
    const layerCanvas = layerCanvasRefs.current[activeLayer];
    if (!layerCanvas) return;
    
    event.preventDefault();
    
    const point = getRelativePosition(event);
    lastPointRef.current = point;
    activePointerIdRef.current = event.pointerId;
    isDrawingRef.current = true;
    
    try {
      displayCanvasRef.current?.setPointerCapture(event.pointerId);
    } catch {}
    
    // Draw initial dot
    const ctx = layerCanvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + 0.1, point.y + 0.1);
      ctx.stroke();
      renderToDisplay();
    }
  }, [activeLayer, brushColor, brushSize, getRelativePosition, renderToDisplay]);

  // Extend stroke
  const extendStroke = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activePointerIdRef.current !== event.pointerId) return;
    
    const layerCanvas = layerCanvasRefs.current[activeLayer];
    if (!layerCanvas || !lastPointRef.current) return;
    
    event.preventDefault();
    
    const currentPoint = getRelativePosition(event);
    const ctx = layerCanvas.getContext('2d');
    
    if (ctx) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      
      lastPointRef.current = currentPoint;
      renderToDisplay();
    }
  }, [activeLayer, brushColor, brushSize, getRelativePosition, renderToDisplay]);

  // End stroke
  const endStroke = useCallback((event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    
    try {
      if (event) {
        displayCanvasRef.current?.releasePointerCapture(event.pointerId);
      }
    } catch {}
    
    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    lastPointRef.current = null;
    
    // Save to history after stroke completes
    saveToHistory();
  }, [saveToHistory]);

  // Clear active layer
  const clearActiveLayer = useCallback(() => {
    const layerCanvas = layerCanvasRefs.current[activeLayer];
    if (!layerCanvas) return;
    
    const ctx = layerCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      renderToDisplay();
      saveToHistory();
    }
  }, [activeLayer, renderToDisplay, saveToHistory]);

  // Clear all layers
  const clearAll = useCallback(() => {
    layerCanvasRefs.current.forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
      }
    });
    renderToDisplay();
    saveToHistory();
  }, [renderToDisplay, saveToHistory]);

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((index: number) => {
    setLayers(prev => prev.map((layer, i) => 
      i === index ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  // Handle background color change
  const handleBackgroundChange = useCallback((color: string) => {
    setBackgroundColor(color);
    // Save to history is called in useEffect when backgroundColor changes
    setTimeout(() => saveToHistory(), 0);
  }, [saveToHistory]);

  // Export final image
  const exportImage = useCallback(() => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;
    const ctx = exportCanvas.getContext('2d');
    
    if (!ctx) return '';
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw all visible layers
    layers.forEach((layer, index) => {
      if (layer.visible && layerCanvasRefs.current[index]) {
        ctx.drawImage(layerCanvasRefs.current[index]!, 0, 0);
      }
    });
    
    return exportCanvas.toDataURL('image/png');
  }, [backgroundColor, layers]);

  // Submit drawing
  const handleSubmit = async () => {
    const dataUrl = exportImage();
    if (dataUrl) {
      await onSubmit(dataUrl, caption.trim());
      // Clear after successful submit
      clearAll();
      setCaption('');
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="relative flex flex-col h-full flex-1 min-h-0">
      {/* Canvas - fixed size, not affected by toolbar */}
      <div className={`flex-1 flex items-center justify-center min-h-0 min-w-0 ${isLandscape ? '' : 'pb-2 md:pb-0'}`}>
        <div className={`relative aspect-video ${isLandscape ? 'h-full w-auto' : 'w-full'} max-w-full max-h-full`}>
          <canvas
            ref={displayCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={`w-full h-full cursor-crosshair bg-white ${
              isLandscape 
                ? 'rounded-lg' 
                : 'border border-border/50 rounded-lg sm:rounded-xl shadow-lg'
            }`}
            style={{ touchAction: 'none' }}
            onPointerDown={beginStroke}
            onPointerMove={extendStroke}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={(e) => {
              if (activePointerIdRef.current === e.pointerId) endStroke(e);
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>

      {/* Mobile: Fixed overlay toolbar at bottom of screen */}
      <div className={`md:hidden fixed z-[110] flex flex-col ${isLandscape ? 'bottom-2 right-2 left-auto' : 'bottom-0 left-0 right-0'}`}>
        {/* Toggle button */}
        <button
          onClick={() => {
            setHasUserToggledToolbar(true);
            setToolbarExpanded(!toolbarExpanded);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 bg-background/95 backdrop-blur-sm transition-all ${
            isLandscape 
              ? 'rounded-full px-3 shadow-lg border border-border/50' 
              : 'w-full border-t border-border/50'
          }`}
        >
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          {!isLandscape && (
            <>
              <span className="text-xs text-muted-foreground font-medium">
                {toolbarExpanded ? 'Hide Tools' : 'Show Tools'}
              </span>
              {toolbarExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </>
          )}
        </button>

        {/* Expandable toolbar content - overlays canvas */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out bg-background/95 backdrop-blur-sm ${
            toolbarExpanded 
              ? isLandscape ? 'max-h-[80vh] max-w-[90vw] border border-border/50 shadow-xl' : 'max-h-[60vh]' 
              : 'max-h-0 border-0'
          } ${isLandscape ? 'absolute bottom-full right-0 mb-2 rounded-xl' : ''}`}
        >
          <div className={`flex flex-col gap-1.5 p-3 ${isLandscape ? 'pb-3' : 'pb-6 border-t border-border/30'}`}>
            {/* Top row: layers + actions */}
            <div className="flex gap-1.5">
              {/* Layers panel */}
              <div className="flex-1 bg-muted/30 rounded-lg p-1.5 border border-border/20">
                <div className="flex items-center gap-1 mb-1">
                  <Layers className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] font-medium uppercase tracking-wide">Layers</span>
                </div>
                <div className="flex gap-1">
                  {[...layers].reverse().map((layer, reversedIndex) => {
                    const index = layers.length - 1 - reversedIndex;
                    return (
                      <div
                        key={layer.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors ${
                          activeLayer === index 
                            ? 'bg-accent/30 text-foreground' 
                            : 'hover:bg-muted/40 text-muted-foreground'
                        }`}
                        onClick={() => setActiveLayer(index)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(index);
                          }}
                          className="hover:bg-muted/50 rounded p-0.5"
                        >
                          {layer.visible ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3 opacity-50" />
                          )}
                        </button>
                        <span className="text-[9px]">{index + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <Button variant="secondary" size="sm" onClick={undo} disabled={!canUndo} className="h-8 w-8 p-0">
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={redo} disabled={!canRedo} className="h-8 w-8 p-0">
                  <Redo2 className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={clearActiveLayer} className="h-8 w-8 p-0" title="Clear layer">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Color controls row */}
            <div className="flex gap-1.5">
              {/* Color mode + palette */}
              <div className="flex-1 bg-muted/30 rounded-lg p-1.5 border border-border/20">
                <div className="flex gap-1 mb-1.5">
                  <button
                    onClick={() => setColorMode('brush')}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[9px] transition-colors ${
                      colorMode === 'brush' ? 'bg-foreground text-background' : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Paintbrush className="w-3 h-3" />
                    Brush
                  </button>
                  <button
                    onClick={() => setColorMode('background')}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[9px] transition-colors ${
                      colorMode === 'background' ? 'bg-foreground text-background' : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PaintBucket className="w-3 h-3" />
                    BG
                  </button>
                </div>

                {/* Color palette */}
                <div className="flex flex-wrap gap-1">
                  {(colorMode === 'brush' ? BRUSH_COLORS : BG_COLORS).map((color) => (
                    <button
                      key={color}
                      onClick={() => colorMode === 'brush' ? setBrushColor(color) : handleBackgroundChange(color)}
                      className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 ${
                        (colorMode === 'brush' ? brushColor : backgroundColor) === color
                          ? 'border-foreground scale-105'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={colorMode === 'brush' ? brushColor : backgroundColor}
                    onChange={(e) => colorMode === 'brush' ? setBrushColor(e.target.value) : handleBackgroundChange(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Brush size */}
              <div className="bg-muted/30 rounded-lg p-1.5 border border-border/20 flex flex-col items-center justify-center gap-1 min-w-[65px]">
                <span className="text-[9px] text-muted-foreground">{brushSize}px</span>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded appearance-none cursor-pointer"
                />
                <div 
                  className="rounded-full border border-border/50 shrink-0"
                  style={{ 
                    width: Math.max(8, Math.min(brushSize, 18)), 
                    height: Math.max(8, Math.min(brushSize, 18)), 
                    backgroundColor: brushColor 
                  }}
                />
              </div>
            </div>

            {/* Caption + Submit row */}
            <div className="flex gap-1.5">
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="caption..."
                maxLength={100}
                className="flex-1 h-8 text-xs bg-background/50"
              />
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || cooldownTimeLeft > 0}
                size="sm"
                className="h-8 px-3 whitespace-nowrap text-xs"
              >
                <Send className="w-3 h-3 mr-1.5" />
                {isSubmitting ? '...' : cooldownTimeLeft > 0 ? formatCooldownTime(cooldownTimeLeft) : 'send'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Normal toolbar below canvas */}
      <div className="hidden md:flex shrink-0 flex-col gap-2 pt-3">
        {/* Top row: layers + actions */}
        <div className="flex gap-2">
          {/* Layers panel */}
          <div className="flex-1 bg-muted/20 rounded-xl p-2 border border-border/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Layers</span>
            </div>
            <div className="flex gap-1">
              {[...layers].reverse().map((layer, reversedIndex) => {
                const index = layers.length - 1 - reversedIndex;
                return (
                  <div
                    key={layer.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                      activeLayer === index 
                        ? 'bg-accent/30 text-foreground' 
                        : 'hover:bg-muted/40 text-muted-foreground'
                    }`}
                    onClick={() => setActiveLayer(index)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(index);
                      }}
                      className="hover:bg-muted/50 rounded p-0.5"
                    >
                      {layer.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3 opacity-50" />
                      )}
                    </button>
                    <span className="text-[10px]">{index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={undo} disabled={!canUndo} className="h-8 w-8 p-0">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={redo} disabled={!canRedo} className="h-8 w-8 p-0">
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={clearActiveLayer} className="h-8 w-8 p-0" title="Clear layer">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Color controls row */}
        <div className="flex gap-2">
          {/* Color mode + palette */}
          <div className="flex-1 bg-muted/20 rounded-xl p-2 border border-border/30">
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => setColorMode('brush')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors ${
                  colorMode === 'brush' ? 'bg-foreground text-background' : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Paintbrush className="w-3 h-3" />
                Brush
              </button>
              <button
                onClick={() => setColorMode('background')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors ${
                  colorMode === 'background' ? 'bg-foreground text-background' : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <PaintBucket className="w-3 h-3" />
                BG
              </button>
            </div>

            {/* Color palette */}
            <div className="flex flex-wrap gap-1">
              {(colorMode === 'brush' ? BRUSH_COLORS : BG_COLORS).map((color) => (
                <button
                  key={color}
                  onClick={() => colorMode === 'brush' ? setBrushColor(color) : handleBackgroundChange(color)}
                  className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 ${
                    (colorMode === 'brush' ? brushColor : backgroundColor) === color
                      ? 'border-foreground scale-105'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={colorMode === 'brush' ? brushColor : backgroundColor}
                onChange={(e) => colorMode === 'brush' ? setBrushColor(e.target.value) : handleBackgroundChange(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Brush size */}
          <div className="bg-muted/20 rounded-xl p-2 border border-border/30 flex flex-col items-center justify-center gap-2 min-w-[70px]">
            <span className="text-[10px] text-muted-foreground">{brushSize}px</span>
            <input
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded appearance-none cursor-pointer"
            />
            <div 
              className="rounded-full border border-border/50 shrink-0"
              style={{ 
                width: Math.max(8, Math.min(brushSize, 18)), 
                height: Math.max(8, Math.min(brushSize, 18)), 
                backgroundColor: brushColor 
              }}
            />
          </div>
        </div>

        {/* Caption + Submit row */}
        <div className="flex gap-2">
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="caption..."
            maxLength={100}
            className="flex-1 h-8 text-xs bg-background/50"
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || cooldownTimeLeft > 0}
            size="sm"
            className="h-8 px-3 whitespace-nowrap text-xs"
          >
            <Send className="w-3 h-3 mr-1.5" />
            {isSubmitting ? '...' : cooldownTimeLeft > 0 ? formatCooldownTime(cooldownTimeLeft) : 'send'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
