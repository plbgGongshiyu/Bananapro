import React, { useRef, useEffect, useState } from 'react';
import { X, Save, RotateCcw, Eraser, Paintbrush } from 'lucide-react';
import './ImageEditor.css';

const ImageEditor = ({ image, onSave, onClose }) => {
    const bgCanvasRef = useRef(null);
    const drawingCanvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#ff0000');
    const [mode, setMode] = useState('draw'); // 'draw' or 'erase'

    useEffect(() => {
        const bgCanvas = bgCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        const bgCtx = bgCanvas.getContext('2d');
        const drawingCtx = drawingCanvas.getContext('2d');

        const img = new Image();
        img.src = image;
        img.onload = () => {
            const maxWidth = window.innerWidth * 0.8;
            const maxHeight = window.innerHeight * 0.7;

            let width = img.width;
            let height = img.height;

            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;

            bgCanvas.width = width;
            bgCanvas.height = height;
            drawingCanvas.width = width;
            drawingCanvas.height = height;

            bgCtx.drawImage(img, 0, 0, width, height);

            drawingCtx.lineCap = 'round';
            drawingCtx.lineJoin = 'round';
            drawingCtx.strokeStyle = brushColor;
            drawingCtx.lineWidth = brushSize;
            contextRef.current = drawingCtx;
        };
    }, [image]);

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = brushColor;
            contextRef.current.lineWidth = brushSize;
            contextRef.current.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
        }
    }, [brushColor, brushSize, mode]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const stopDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const handleSave = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = bgCanvasRef.current.width;
        tempCanvas.height = bgCanvasRef.current.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Merge layers
        tempCtx.drawImage(bgCanvasRef.current, 0, 0);
        tempCtx.drawImage(drawingCanvasRef.current, 0, 0);

        const dataUrl = tempCanvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    const handleReset = () => {
        const drawingCanvas = drawingCanvasRef.current;
        const ctx = drawingCanvas.getContext('2d');
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    };

    return (
        <div className="editor-overlay">
            <div className="editor-container glass animate-fade-in">
                <div className="editor-header">
                    <h3>Edit Image</h3>
                    <button className="close-btn" onClick={onClose}><X /></button>
                </div>

                <div className="editor-body">
                    <div className="canvas-wrapper">
                        <canvas ref={bgCanvasRef} className="bg-canvas" />
                        <canvas
                            ref={drawingCanvasRef}
                            className="drawing-canvas"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                    </div>
                </div>

                <div className="editor-footer">
                    <div className="editor-tools">
                        <div className="tool-group">
                            <button
                                className={`tool-btn ${mode === 'draw' ? 'active' : ''}`}
                                onClick={() => setMode('draw')}
                            >
                                <Paintbrush size={18} />
                            </button>
                            <button
                                className={`tool-btn ${mode === 'erase' ? 'active' : ''}`}
                                onClick={() => setMode('erase')}
                            >
                                <Eraser size={18} />
                            </button>
                        </div>

                        <div className="tool-group">
                            <input
                                type="color"
                                value={brushColor}
                                onChange={(e) => setBrushColor(e.target.value)}
                                className="color-picker"
                            />
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="size-slider"
                            />
                            <span className="size-label">{brushSize}px</span>
                        </div>

                        <button className="tool-btn" onClick={handleReset} title="Clear Drawing">
                            <RotateCcw size={18} />
                        </button>
                    </div>

                    <button className="btn btn-primary" onClick={handleSave}>
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
