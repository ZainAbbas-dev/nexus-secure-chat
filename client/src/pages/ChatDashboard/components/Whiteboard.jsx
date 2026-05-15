import { PenTool, X } from 'lucide-react';

export default function Whiteboard({
  setShowWhiteboard,
  brushColor,
  setBrushColor,
  clearCanvas,
  canvasRef,
  startDrawing,
  draw,
  stopDrawing
}) {
  return (
    <div className="absolute inset-0 bg-dark-900/95 z-40 flex flex-col items-center justify-center backdrop-blur-md">
      <div className="w-[800px] flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><PenTool className="h-5 w-5 text-purple-400"/> Shared Whiteboard</h2>
          <div className="flex gap-2">
            {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map(c => (
              <button 
                key={c} 
                onClick={() => setBrushColor(c)} 
                className={`h-6 w-6 rounded-full border-2 ${brushColor === c ? 'border-white scale-110' : 'border-transparent'}`} 
                style={{ backgroundColor: c }} 
              />
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={clearCanvas} className="text-gray-400 hover:text-red-400 transition font-medium">Clear Board</button>
          <button onClick={() => setShowWhiteboard(false)} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition"><X className="h-5 w-5 text-white" /></button>
        </div>
      </div>
      <div className="bg-dark-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 cursor-crosshair">
        <canvas 
          ref={canvasRef} 
          onMouseDown={startDrawing} 
          onMouseMove={draw} 
          onMouseUp={stopDrawing} 
          onMouseOut={stopDrawing} 
          className="touch-none block" 
        />
      </div>
    </div>
  );
}