import { Terminal, X } from 'lucide-react';
import Editor from '@monaco-editor/react';

export default function LiveCodeEditor({
  setShowCodeEditor,
  liveCode,
  handleCodeChange
}) {
  return (
    <div className="absolute inset-0 bg-dark-900/95 z-40 flex flex-col items-center justify-center backdrop-blur-md px-10 py-6">
      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Terminal className="h-5 w-5 text-green-400"/> Operational Transformation: Live Code Sync
        </h2>
        <button onClick={() => setShowCodeEditor(false)} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
      <div className="flex-1 w-full rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
         <Editor 
           height="100%" 
           theme="vs-dark" 
           defaultLanguage="javascript" 
           value={liveCode} 
           onChange={handleCodeChange} 
           options={{ minimap: { enabled: false }, fontSize: 16 }} 
         />
      </div>
    </div>
  );
}