import { useState, useRef, useEffect } from 'react';
import CryptoJS from 'crypto-js';

export const useWhiteboard = (socket, room, roomKey) => {
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#3b82f6");
  
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (showWhiteboard && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = 800;
      canvasRef.current.height = 500;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 4;
      ctxRef.current = ctx;
    }
  }, [showWhiteboard]);

  useEffect(() => {
    if (!socket || !roomKey) return;

    const handleReceiveDraw = (encryptedData) => {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, roomKey);
        const { start, end, color } = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        drawOnCanvas(start, end, color);
      } catch (err) {
        console.error("Whiteboard decryption failed");
      }
    };

    const handleReceiveClear = () => {
      if (ctxRef.current && canvasRef.current) {
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };

    socket.on("receive_whiteboard_draw", handleReceiveDraw);
    socket.on("receive_whiteboard_clear", handleReceiveClear);

    return () => {
      socket.off("receive_whiteboard_draw", handleReceiveDraw);
      socket.off("receive_whiteboard_clear", handleReceiveClear);
    };
  }, [socket, roomKey]);

  const drawOnCanvas = (start, end, color) => {
    if (!ctxRef.current) return;
    ctxRef.current.beginPath();
    ctxRef.current.strokeStyle = color;
    ctxRef.current.moveTo(start.x, start.y);
    ctxRef.current.lineTo(end.x, end.y);
    ctxRef.current.stroke();
    ctxRef.current.closePath();
  };

  const startDrawing = ({ nativeEvent }) => {
    lastPos.current = { x: nativeEvent.offsetX, y: nativeEvent.offsetY };
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (canvasRef.current && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (socket && room) {
        socket.emit("whiteboard_clear", room);
      }
    }
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    
    const currentPos = { x: nativeEvent.offsetX, y: nativeEvent.offsetY };
    drawOnCanvas(lastPos.current, currentPos, brushColor);
    
    if (socket && room && roomKey) {
      const payload = JSON.stringify({ start: lastPos.current, end: currentPos, color: brushColor });
      const encryptedData = CryptoJS.AES.encrypt(payload, roomKey).toString();
      socket.emit("whiteboard_draw", { room, data: encryptedData });
    }
    
    lastPos.current = currentPos;
  };

  return {
    canvasRef,
    showWhiteboard,
    setShowWhiteboard,
    brushColor,
    setBrushColor,
    startDrawing,
    stopDrawing,
    draw,
    clearCanvas
  };
};