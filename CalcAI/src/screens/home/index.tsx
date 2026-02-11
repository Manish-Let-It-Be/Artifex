import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { SWATCHES } from '@/constants';
import { 
    Eraser, 
    Pencil, 
    Square, 
    Circle, 
    Triangle, 
    Undo2, 
    Redo2, 
    Calculator, 
    Trash2,
    X,
    ChevronLeft,
    Loader2
} from 'lucide-react';

// --- Types ---

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

interface Shape {
    type: 'circle' | 'square' | 'triangle';
    startX: number;
    startY: number;
    width: number;
    height: number;
    color: string;
}

interface BrushStroke {
    points: { x: number; y: number }[];
    color: string;
    size: number;
    type: 'brush' | 'eraser';
}

interface DragState {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

type Tool = 'brush' | 'eraser' | 'circle' | 'square' | 'triangle';

export default function Home() {
    // --- Refs & State ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Tools State
    const [selectedTool, setSelectedTool] = useState<Tool>('brush');
    const [color, setColor] = useState('black');
    const [brushSize, setBrushSize] = useState(4);
    const [eraserSize, setEraserSize] = useState(20);
    
    // Canvas Data State
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [brushStrokes, setBrushStrokes] = useState<BrushStroke[]>([]);
    
    // Interaction State
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<BrushStroke | null>(null);
    const [isDraggingShape, setIsDraggingShape] = useState(false);
    // Fixed: Properly typed state instead of 'any' casting
    const [dragStart, setDragStart] = useState<DragState | null>(null);

    // History & Math State
    const [history, setHistory] = useState<Array<{ shapes: Shape[]; brushStrokes: BrushStroke[] }>>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [dictOfVars, setDictOfVars] = useState({});
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // UI State
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // --- Helpers defined before use in renderCanvas ---
    
    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.save();
        ctx.fillStyle = '#e5e7eb'; // Light gray dots
        const spacing = 40;
        for (let x = 0; x < w; x += spacing) {
            for (let y = 0; y < h; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    };

    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: BrushStroke) => {
        if (stroke.points.length < 1) return;
        
        ctx.beginPath();
        ctx.lineWidth = stroke.size;
        ctx.strokeStyle = stroke.type === 'eraser' ? '#ffffff' : stroke.color;
        
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let i = 1; i < stroke.points.length - 1; i++) {
            const p1 = stroke.points[i];
            const p2 = stroke.points[i + 1];
            const midPoint = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            };
            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        }
        
        if (stroke.points.length > 1) {
            const last = stroke.points[stroke.points.length - 1];
            ctx.lineTo(last.x, last.y);
        }
        
        ctx.stroke();
    };

    const drawShapeObj = (ctx: CanvasRenderingContext2D, shape: Shape) => {
        ctx.beginPath();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 3;

        switch (shape.type) {
            case 'circle': {
                const radius = Math.sqrt(Math.pow(shape.width, 2) + Math.pow(shape.height, 2)) / 2;
                const centerX = shape.startX + shape.width / 2;
                const centerY = shape.startY + shape.height / 2;
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                break;
            }
            case 'square': {
                ctx.rect(shape.startX, shape.startY, shape.width, shape.height);
                break;
            }
            case 'triangle': {
                ctx.moveTo(shape.startX + shape.width / 2, shape.startY);
                ctx.lineTo(shape.startX, shape.startY + shape.height);
                ctx.lineTo(shape.startX + shape.width, shape.startY + shape.height);
                ctx.closePath();
                break;
            }
        }
        ctx.stroke();
    };

    // --- Rendering Logic ---
    
    // Fixed: Wrapped in useCallback with full dependency list
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        drawGrid(ctx, rect.width, rect.height);

        brushStrokes.forEach(stroke => drawStroke(ctx, stroke));
        shapes.forEach(shape => drawShapeObj(ctx, shape));

        if (currentStroke) {
            drawStroke(ctx, currentStroke);
        }
        
        if (isDraggingShape && dragStart && (selectedTool === 'square' || selectedTool === 'circle' || selectedTool === 'triangle')) {
            const tempShape: Shape = {
                type: selectedTool,
                startX: dragStart.startX,
                startY: dragStart.startY,
                width: dragStart.currentX - dragStart.startX,
                height: dragStart.currentY - dragStart.startY,
                color: color
            };
            drawShapeObj(ctx, tempShape);
        }
    }, [brushStrokes, shapes, currentStroke, isDraggingShape, dragStart, selectedTool, color]);

    // --- MathJax Setup ---
    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
      
    }, [latexExpression]);

    // --- Canvas Setup ---
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
        }
        renderCanvas();
    }, [renderCanvas]); // Fixed: Added renderCanvas dependency

    // Fixed: Added renderCanvas dependency (though initCanvas already depends on it, clean chain is better)
    useEffect(() => {
        initCanvas();
        window.addEventListener('resize', initCanvas);
        return () => window.removeEventListener('resize', initCanvas);
    }, [initCanvas]);

    // Re-render when data changes
    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // --- Input Handlers ---
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoordinates(e);

        if (selectedTool === 'brush' || selectedTool === 'eraser') {
            setIsDrawing(true);
            setCurrentStroke({
                points: [coords],
                color: color,
                size: selectedTool === 'eraser' ? eraserSize : brushSize,
                type: selectedTool === 'eraser' ? 'eraser' : 'brush'
            });
        } else {
            setIsDraggingShape(true);
            // Fixed: Using typed state object
            setDragStart({ 
                startX: coords.x, 
                startY: coords.y, 
                currentX: coords.x, 
                currentY: coords.y 
            });
        }
    };

    const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoordinates(e);

        if (isDrawing && currentStroke) {
            const newPoints = [...currentStroke.points, coords];
            setCurrentStroke({ ...currentStroke, points: newPoints });
        } else if (isDraggingShape && dragStart) {
            // Fixed: Updating typed state
            setDragStart({ 
                ...dragStart, 
                currentX: coords.x, 
                currentY: coords.y 
            });
        }
    };

    const stopDrawing = () => {
        if (isDrawing && currentStroke) {
            const newHistory = [...history.slice(0, historyIndex + 1)];
            newHistory.push({
                shapes: [...shapes],
                brushStrokes: [...brushStrokes, currentStroke]
            });
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setBrushStrokes(prev => [...prev, currentStroke]);
            setIsDrawing(false);
            setCurrentStroke(null);
        } else if (isDraggingShape && dragStart) {
            // Fixed: Safe property access
            const newShape: Shape = {
                type: selectedTool as 'circle' | 'square' | 'triangle',
                startX: dragStart.startX,
                startY: dragStart.startY,
                width: dragStart.currentX - dragStart.startX,
                height: dragStart.currentY - dragStart.startY,
                color: color
            };
            
            const newHistory = [...history.slice(0, historyIndex + 1)];
            newHistory.push({
                shapes: [...shapes, newShape],
                brushStrokes: [...brushStrokes]
            });
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setShapes(prev => [...prev, newShape]);
            setIsDraggingShape(false);
            setDragStart(null);
        }
    };

    // --- Actions ---
    const undo = () => {
        if (historyIndex > 0) {
            const previousState = history[historyIndex - 1];
            setShapes(previousState.shapes);
            setBrushStrokes(previousState.brushStrokes);
            setHistoryIndex(prev => prev - 1);
        } else if (historyIndex === 0) {
            setShapes([]);
            setBrushStrokes([]);
            setHistoryIndex(-1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setShapes(nextState.shapes);
            setBrushStrokes(nextState.brushStrokes);
            setHistoryIndex(prev => prev + 1);
        }
    };

    const clearCanvas = () => {
        setShapes([]);
        setBrushStrokes([]);
        setHistory([]);
        setHistoryIndex(-1);
        setLatexExpression([]);
        setDictOfVars({});
    };

   const runMath = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsProcessing(true);

        try {
            // 1. HIDE GRID: Clear canvas and redraw ONLY strokes/shapes (No Grid)
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const rect = canvas.getBoundingClientRect();
                ctx.clearRect(0, 0, rect.width, rect.height);
                // Background color (important for AI to see contrast)
                ctx.fillStyle = 'grey'; 
                ctx.fillRect(0, 0, rect.width, rect.height);
                
                // Draw only the user's work
                brushStrokes.forEach(stroke => drawStroke(ctx, stroke));
                shapes.forEach(shape => drawShapeObj(ctx, shape));
            }

            // 2. CAPTURE IMAGE: Now the image has no dots, just math
            const base64Image = canvas.toDataURL('image/png');

            // 3. RESTORE GRID: Immediately redraw everything including the grid
            renderCanvas();

            // 4. SEND TO API
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/calculate`, {
                image: base64Image,
                dict_of_vars: dictOfVars,
            });

            const resp = response.data;
            
            resp.data.forEach((data: Response) => {
                if (data.assign) {
                    setDictOfVars(prev => ({ ...prev, [data.expr]: data.result }));
                }
            });

            resp.data.forEach((data: Response) => {
                const latex = `({${data.expr} = ${data.result}})`;
                // NEW LINE (Allows conversational text)
                //const latex = data.result;
                setLatexExpression(prev => [...prev, latex]);
            });

            setIsPanelOpen(true);
        } catch (error) {
            console.error('API Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };
    return (
        <div className="relative w-full h-screen bg-white overflow-hidden font-sans selection:bg-blue-100">
            
            {/* --- Main Canvas Area --- */}
            <div ref={containerRef} className="absolute inset-0 z-0">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={drawMove}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={drawMove}
                    onTouchEnd={stopDrawing}
                />
            </div>

            {/* --- Top Bar (Logo & Primary Actions) --- */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md shadow-sm border border-gray-200 rounded-full px-4 py-2 pointer-events-auto flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-semibold text-gray-700 ml-2">Math Board</span>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full bg-white/90 shadow-sm hover:bg-gray-50"
                        onClick={undo}
                        disabled={historyIndex < 0}
                    >
                        <Undo2 className="w-4 h-4 text-gray-700" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full bg-white/90 shadow-sm hover:bg-gray-50"
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                    >
                        <Redo2 className="w-4 h-4 text-gray-700" />
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="rounded-full shadow-sm"
                        onClick={clearCanvas}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* --- Floating Bottom Toolbar --- */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
                <div className="flex flex-col gap-4 items-center">
                    
                    {/* Size Slider */}
                    {(selectedTool === 'brush' || selectedTool === 'eraser') && (
                        <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-2 shadow-lg mb-2 w-48 transition-all">
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-8">Size</span>
                                <input 
                                    type="range" 
                                    min={1} 
                                    max={selectedTool === 'eraser' ? 50 : 20} 
                                    value={selectedTool === 'eraser' ? eraserSize : brushSize}
                                    onChange={(e) => selectedTool === 'eraser' ? setEraserSize(Number(e.target.value)) : setBrushSize(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                             </div>
                        </div>
                    )}

                    {/* Main Tools Container */}
                    <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
                        {/* Tools Group */}
                        <div className="flex items-center gap-3 border-r border-gray-200 pr-6">
                            <ToolButton 
                                active={selectedTool === 'brush'} 
                                onClick={() => setSelectedTool('brush')}
                                icon={<Pencil className="w-5 h-5" />}
                            />
                            <ToolButton 
                                active={selectedTool === 'eraser'} 
                                onClick={() => setSelectedTool('eraser')}
                                icon={<Eraser className="w-5 h-5" />}
                            />
                        </div>

                        {/* Shapes Group */}
                        <div className="flex items-center gap-3 border-r border-gray-200 pr-6">
                            <ToolButton 
                                active={selectedTool === 'square'} 
                                onClick={() => setSelectedTool('square')}
                                icon={<Square className="w-5 h-5" />}
                            />
                            <ToolButton 
                                active={selectedTool === 'circle'} 
                                onClick={() => setSelectedTool('circle')}
                                icon={<Circle className="w-5 h-5" />}
                            />
                            <ToolButton 
                                active={selectedTool === 'triangle'} 
                                onClick={() => setSelectedTool('triangle')}
                                icon={<Triangle className="w-5 h-5" />}
                            />
                        </div>

                        {/* Colors Group */}
                        <div className="flex items-center gap-2 border-r border-gray-200 pr-6">
                            {SWATCHES.map((swatch: string) => (
                                <button
                                    key={swatch}
                                    onClick={() => setColor(swatch)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                        color === swatch ? 'border-gray-900 scale-110' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: swatch }}
                                />
                            ))}
                        </div>

                        {/* Action Button */}
                        <Button
                            onClick={runMath}
                            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4" />
                                    <span>Calculate</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Results Side Panel --- */}
            <div 
                className={`absolute top-4 bottom-24 right-4 w-96 transition-transform duration-300 ease-in-out transform z-20 ${
                    isPanelOpen ? 'translate-x-0' : 'translate-x-[110%]'
                }`}
            >
                <div className="h-full bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Panel Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/50">
                        <h2 className="font-semibold text-gray-800">Calculation Results</h2>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsPanelOpen(false)}
                            className="rounded-full hover:bg-gray-200/50"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    {/* Results Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {latexExpression.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                <Calculator className="w-12 h-12 mb-2" />
                                <p>Draw an equation and hit Calculate</p>
                            </div>
                        ) : (
                            latexExpression.map((latex, index) => (
                                <div 
                                    key={index} 
                                    className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-right fade-in duration-300"
                                >
                                    <div className="text-gray-800 text-lg font-medium tracking-wide">
                                        <div dangerouslySetInnerHTML={{ __html: latex }} /> 
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Panel Toggle Button (When closed) */}
            {!isPanelOpen && latexExpression.length > 0 && (
                <Button
                    onClick={() => setIsPanelOpen(true)}
                    className="absolute top-1/2 right-0 transform -translate-y-1/2 rounded-l-full bg-white shadow-md border-l border-y border-gray-200 text-gray-600 z-10 pl-2 pr-4 py-6"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            )}

        </div>
    );
}

// --- Helper Component ---

function ToolButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-2xl transition-all duration-200 ${
                active 
                    ? 'bg-gray-100 text-blue-600 shadow-inner transform scale-105' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
            {icon}
        </button>
    );
}