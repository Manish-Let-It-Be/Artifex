import { ColorSwatch } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { SWATCHES } from '@/constants';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

interface Shape {
    type: 'circle' | 'square' | 'triangle' | 'brush';
    startX: number;
    startY: number;
    width: number;
    height: number;
}

// Add a new interface for brush strokes
interface BrushStroke {
    points: { x: number; y: number }[];
    color: string;
    size: number;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [isEraser, setIsEraser] = useState(false);
    const [eraserSize, setEraserSize] = useState(10);
    const [brushSize, setBrushSize] = useState(5); // New brush size state
    const [selectedShape, setSelectedShape] = useState<'circle' | 'square' | 'triangle' | 'brush' | null>(null);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [brushStrokes, setBrushStrokes] = useState<BrushStroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<BrushStroke | null>(null);
    const [history, setHistory] = useState<Array<{
        shapes: Shape[];
        brushStrokes: BrushStroke[];
    }>>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultPanelWidth, setResultPanelWidth] = useState(384); // w-96 = 384px

    // Define renderLatexToCanvas first
    const renderLatexToCanvas = useCallback((expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression(prev => [...prev, latex]);
    }, []);

    // Then define useEffects that depend on it
    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result, renderLatexToCanvas]);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (reset) {
            // Clear canvas
            resetCanvas();
            // Reset all states
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setShapes([]);
            setBrushStrokes([]); // Clear brush strokes
            setCurrentStroke(null);
            setHistory([]); // Clear history
            setHistoryIndex(-1);
            // Set canvas background to black
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        document.body.style.backgroundColor = 'black';
    
        // Clean up to reset the background color when component unmounts
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);
    

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateCanvasSize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            
            const rect = parent.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                renderShapes(); // Redraw everything after resize
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    //RESET Function
    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };
    //START DRAWING Function
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                setIsDrawing(true);
                const newStroke: BrushStroke = {
                    points: [{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }],
                    color: isEraser ? 'rgba(0, 0, 0, 1)' : color,
                    size: isEraser ? eraserSize : brushSize
                };
                setCurrentStroke(newStroke);
            }
        }
    };
    //START DRAWING SHAPE Function
    const startDrawingShape = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (selectedShape) {
            setIsDragging(true);
            setStartX(e.nativeEvent.offsetX);
            setStartY(e.nativeEvent.offsetY);
        }
    };

    const drawShape = (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = x - rect.left;
        const mouseY = y - rect.top;

        // Clear and redraw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderShapes(); // Redraw existing shapes

        // Draw current shape
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        switch (selectedShape) {
            case 'circle': {
                const radius = Math.sqrt(
                    Math.pow(mouseX - startX, 2) + Math.pow(mouseY - startY, 2)
                ) / 2;
                const centerX = (mouseX + startX) / 2;
                const centerY = (mouseY + startY) / 2;
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                break;
            }
            case 'square': {
                const width = mouseX - startX;
                const height = mouseY - startY;
                const size = Math.max(Math.abs(width), Math.abs(height));
                ctx.rect(
                    startX,
                    startY,
                    Math.sign(width) * size,
                    Math.sign(height) * size
                );
                break;
            }
            case 'triangle': {
                ctx.moveTo(startX, startY);
                ctx.lineTo(mouseX, mouseY);
                ctx.lineTo(startX - (mouseX - startX), mouseY);
                ctx.closePath();
                break;
            }
        }
        ctx.stroke();
    };
    

    const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (isDragging && selectedShape) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const endX = (e.clientX - rect.left) * scaleX;
            const endY = (e.clientY - rect.top) * scaleY;

            const newShape: Shape = {
                type: selectedShape,
                startX,
                startY,
                width: endX - startX,
                height: endY - startY,
            };

            setShapes(prev => [...prev, newShape]);
            setIsDragging(false);
        } else if (currentStroke) {
            setBrushStrokes(prev => [...prev, currentStroke]);
        }
        
        setIsDrawing(false);
        setCurrentStroke(null);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        if (isDrawing && currentStroke) {
            // Handle brush stroke
            currentStroke.points.push({ x, y });
            
            ctx.beginPath();
            ctx.strokeStyle = currentStroke.color;
            ctx.lineWidth = currentStroke.size;
            ctx.lineCap = 'round';
            
            const points = currentStroke.points;
            const lastPoint = points[points.length - 2];
            const currentPoint = points[points.length - 1];
            
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
        } else if (isDragging && selectedShape) {
            // Handle shape preview
            drawShape(x, y);
        }
    };

    //render
    const renderShapes = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw all brush strokes
        brushStrokes.forEach(stroke => {
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = 'round';
            
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.moveTo(stroke.points[i-1].x, stroke.points[i-1].y);
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                ctx.stroke();
            }
        });

        // Draw all shapes
        shapes.forEach(shape => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            // Convert coordinates
            const startX = shape.startX * scaleX;
            const startY = shape.startY * scaleY;
            const width = shape.width * scaleX;
            const height = shape.height * scaleY;

            switch (shape.type) {
                case 'circle': {
                    const radius = Math.sqrt(width * width + height * height) / 2;
                    const centerX = startX + width / 2;
                    const centerY = startY + height / 2;
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    break;
                }
                case 'square': {
                    const size = Math.max(Math.abs(width), Math.abs(height));
                    const signX = width >= 0 ? 1 : -1;
                    const signY = height >= 0 ? 1 : -1;
                    ctx.rect(startX, startY, size * signX, size * signY);
                    break;
                }
                case 'triangle': {
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(startX + width, startY + height);
                    ctx.lineTo(startX - width, startY + height);
                    ctx.closePath();
                    break;
                }
            }
            ctx.stroke();
        });
    }, [brushStrokes, shapes, color]);

    const renderCanvas = useCallback(() => {
        renderShapes();
    }, [renderShapes]);

    const runRoute = async () => {
        setIsProcessing(true);
        try {
            const canvas = canvasRef.current;
            if (canvas) {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/calculate`, {
                    image: canvas.toDataURL('image/png'),
                    dict_of_vars: dictOfVars,
                });

                const resp = await response.data;
                resp.data.forEach((data: Response) => {
                    if (data.assign) {
                        setDictOfVars((prev) => ({
                            ...prev,
                            [data.expr]: data.result,
                        }));
                    }
                });

                resp.data.forEach((data: Response) => {
                    setTimeout(() => {
                        setResult({
                            expression: data.expr,
                            answer: data.result,
                        });
                    }, 1000);
                });
            }
        } catch (error) {
            console.error('Error processing image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Add undo/redo functions
    const undo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setShapes(prevState.shapes);
            setBrushStrokes(prevState.brushStrokes);
            setHistoryIndex(prev => prev - 1);
            renderShapes();
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setShapes(nextState.shapes);
            setBrushStrokes(nextState.brushStrokes);
            setHistoryIndex(prev => prev + 1);
            renderShapes();
        }
    };

    const saveCanvas = () => {
        const state = {
            shapes,
            brushStrokes,
            latexExpression,
            dictOfVars
        };
        localStorage.setItem('canvasState', JSON.stringify(state));
    };

    const loadCanvas = () => {
        const savedState = localStorage.getItem('canvasState');
        if (savedState) {
            const state = JSON.parse(savedState);
            setShapes(state.shapes);
            setBrushStrokes(state.brushStrokes);
            setLatexExpression(state.latexExpression);
            setDictOfVars(state.dictOfVars);
            renderCanvas();
        }
    };

    useEffect(() => {
        if (shapes.length > 0 || brushStrokes.length > 0) {
            const newState = {
                shapes: [...shapes],
                brushStrokes: [...brushStrokes]
            };
            setHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
            setHistoryIndex(prev => prev + 1);
        }
    }, [shapes, brushStrokes]);

    // Add window resize handler
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                // Redraw everything after resize
                renderShapes();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [renderShapes]);

    // Add resize handler component
    const ResizeHandle = () => (
        <div
            className="w-1 h-full cursor-col-resize bg-gray-700 hover:bg-gray-600 active:bg-gray-500"
            onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.pageX;
                const startWidth = resultPanelWidth;

                const handleMouseMove = (e: MouseEvent) => {
                    const delta = startX - e.pageX;
                    const newWidth = Math.min(Math.max(startWidth + delta, 250), window.innerWidth / 2);
                    setResultPanelWidth(newWidth);
                };

                const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }}
        />
    );

    return (
        <div className="flex h-screen bg-black">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Title and Controls */}
                <div className="p-4 bg-gray-900 border-b border-gray-800">
                    <h1 className="text-3xl font-bold text-center mb-4 text-white glow-effect">
                        Artifex
                    </h1>
                    
                    <div className="grid grid-cols-4 gap-4">
                        {/* Drawing Tools with Size Controls */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-400">Tools</h3>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setSelectedShape('brush')}
                                    variant={selectedShape === 'brush' ? "default" : "secondary"}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Brush
                                </Button>
                                <Button
                                    onClick={() => setIsEraser(!isEraser)}
                                    variant={isEraser ? "destructive" : "secondary"}
                                    className="flex-1"
                                >
                                    {isEraser ? 'Draw' : 'Eraser'}
                                </Button>
                            </div>
                            {/* Add size controls */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Brush Size: {brushSize}</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Eraser Size: {eraserSize}</span>
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        value={eraserSize}
                                        onChange={(e) => setEraserSize(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shapes */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-400">Shapes</h3>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setSelectedShape('circle')}
                                    variant={selectedShape === 'circle' ? "default" : "secondary"}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Circle
                                </Button>
                                <Button
                                    onClick={() => setSelectedShape('square')}
                                    variant={selectedShape === 'square' ? "default" : "secondary"}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Square
                                </Button>
                                <Button
                                    onClick={() => setSelectedShape('triangle')}
                                    variant={selectedShape === 'triangle' ? "default" : "secondary"}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Triangle
                                </Button>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-400">Colors</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {SWATCHES.map((swatch) => (
                                    <ColorSwatch
                                        key={swatch}
                                        color={swatch}
                                        onClick={() => setColor(swatch)}
                                        className="cursor-pointer hover:ring-2 ring-white transform hover:scale-110 transition-all"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-400">Actions</h3>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setReset(true)}
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1"
                                >
                                    Reset
                                </Button>
                                <Button
                                    onClick={runRoute}
                                    variant="default"
                                    size="sm"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    Run
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* History Controls */}
                    <div className="flex justify-center gap-2 mt-4">
                        <Button
                            onClick={undo}
                            variant="outline"
                            size="sm"
                            disabled={historyIndex <= 0}
                            className="hover:bg-gray-800"
                        >
                            Undo
                        </Button>
                        <Button
                            onClick={redo}
                            variant="outline"
                            size="sm"
                            disabled={historyIndex >= history.length - 1}
                            className="hover:bg-gray-800"
                        >
                            Redo
                        </Button>
                        <Button
                            onClick={saveCanvas}
                            variant="outline"
                            size="sm"
                            className="hover:bg-gray-800"
                        >
                            Save
                        </Button>
                        <Button
                            onClick={loadCanvas}
                            variant="outline"
                            size="sm"
                            className="hover:bg-gray-800"
                        >
                            Load
                        </Button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative bg-black overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0"
                        style={{ 
                            width: `calc(100% - ${resultPanelWidth}px)`,
                            height: '100%'
                        }}
                        onMouseDown={(e) => {
                            if (selectedShape === 'brush' || !selectedShape) {
                                startDrawing(e);
                            } else {
                                startDrawingShape(e);
                            }
                        }}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                    />
                </div>
            </div>

            {/* Results Panel */}
            <div className="flex h-full" style={{ width: resultPanelWidth }}>
                <ResizeHandle />
                <div className="flex-1 bg-gray-900 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h2 className="text-lg font-semibold text-white">Results</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLatexExpression([])}
                        >
                            Clear
                        </Button>
                    </div>
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {latexExpression.map((latex, index) => (
                            <div
                                key={index}
                                className="p-4 bg-gray-800 rounded-lg shadow-md hover:bg-gray-750 transition-colors"
                            >
                                <div 
                                    className="latex-content whitespace-pre-wrap break-words text-white"
                                    style={{ 
                                        wordSpacing: '0.25em',
                                        lineHeight: '1.5',
                                        maxWidth: '100%'
                                    }}
                                >
                                    {latex.split('\\)')[0].split('\\(')[1]
                                        .replace(/\\LARGE/g, '')
                                        .replace(/{|}/g, '')
                                        .split('=')
                                        .map(part => part.trim())
                                        .join(' = ')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* GitHub Profile Link */}
                    <a 
                        href="https://github.com/Manish-Let-It-Be"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 border-t border-gray-800 hover:bg-gray-800 transition-colors group"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg 
                                className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
                                fill="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                                Visit GitHub Profile
                            </span>
                        </div>
                    </a>
                </div>
            </div>

            {/* Loading Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto" />
                        <p className="text-white text-center mt-4">Processing...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
