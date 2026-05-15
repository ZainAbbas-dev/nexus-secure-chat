import { Paperclip, Terminal, Send } from 'lucide-react';

export default function MessageInput({
  currentMessage,
  handleTyping,
  sendMessage,
  fileInputRef,
  handleFileUpload,
  insertCodeTemplate,
  activeChat
}) {
  return (
    <div className="flex flex-col bg-dark-800 border-t border-gray-800">
      <div className="p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current.click()} 
            className="bg-dark-900 border border-gray-700 p-3 rounded-xl hover:bg-gray-800"
          >
            <Paperclip className="h-5 w-5 text-gray-400" />
          </button>
          
          <button 
            type="button" 
            onClick={insertCodeTemplate} 
            className="bg-dark-900 border border-gray-700 p-3 rounded-xl hover:bg-gray-800 transition"
          >
            <Terminal className="h-5 w-5 text-green-400" />
          </button>

          <input 
            type="text" 
            value={currentMessage} 
            onChange={handleTyping} 
            placeholder={`Message ${activeChat.full_name}...`} 
            className="flex-1 bg-dark-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-brand-500" 
          />
          
          <button 
            type="submit" 
            className="bg-brand-500 p-3 rounded-xl h-[50px] w-[50px] shrink-0 hover:bg-brand-600"
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}