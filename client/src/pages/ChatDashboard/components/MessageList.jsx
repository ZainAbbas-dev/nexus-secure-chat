import { ShieldAlert, FileText, Terminal, CheckCheck, Check, Trash2 } from 'lucide-react';

export default function MessageList({
  messages,
  user,
  isTyping,
  messagesEndRef,
  API_URL,
  isSpam,
  setShowDeleteModal,
  setShowCodeEditor
}) {
  const visibleMessages = messages.filter(msg => !(msg.deleted_for && msg.deleted_for.includes(user.full_name)));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
      {visibleMessages.map((msg) => {
        const isMe = msg.author === user?.full_name;
        const isFileUrl = msg.message.startsWith(`${API_URL}/uploads/`);
        const isImage = isFileUrl && msg.message.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
        const isDoc = isFileUrl && !isImage;
        const isCodeBlock = msg.message === "LIVE_CODE_BLOCK";
        
        const spamFlag = !isMe && !msg.is_deleted && !isFileUrl && !isCodeBlock && isSpam(msg.message);
        const messageKey = msg.id || msg.tempId || `msg-${Math.random()}`;

        return (
          <div key={messageKey} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
            <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-md ${ msg.is_deleted ? 'bg-transparent border border-gray-700 text-gray-500 italic' : isCodeBlock ? 'bg-gray-800 border border-green-500/50 text-white rounded-lg w-64' : isMe ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-dark-800 border border-gray-700 text-gray-100 rounded-tl-sm'}`}>
                
                {spamFlag && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs p-2 rounded-lg mb-2 flex gap-2 items-start">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                    <p><strong>Security Alert:</strong> This message matches known phishing or scam patterns. Do not click links or share information.</p>
                  </div>
                )}

                {msg.is_deleted ? (
                  <div className="flex items-center gap-2">🚫 <span>This message was deleted</span></div>
                ) : isImage ? (
                  <img src={msg.message} alt="Media" className="max-w-[200px] sm:max-w-xs rounded-lg mt-1 cursor-pointer" />
                ) : isDoc ? (
                  <a href={msg.message} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-dark-900/50 p-3 rounded-xl hover:bg-dark-900 transition">
                    <div className="p-2 bg-brand-500/20 rounded-lg text-brand-500"><FileText className="h-6 w-6" /></div>
                    <span className="text-sm font-medium underline">Download Attachment</span>
                  </a>
                ) : isCodeBlock ? (
                    <div className="flex flex-col items-center justify-center p-2">
                      <Terminal className="h-8 w-8 text-green-400 mb-2" />
                      <p className="font-bold text-sm mb-3">Live Code Session</p>
                      <button onClick={() => setShowCodeEditor(true)} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-semibold transition">Join Session</button>
                    </div>
                ) : (
                  <p className="break-words">{msg.message}</p>
                )}
                {!msg.is_deleted && (
                  <span className="text-[10px] opacity-60 flex justify-end mt-1 items-center gap-1">
                    {msg.time}
                    {isMe && (
                      msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-400" /> : 
                      msg.status === 'delivered' ? <CheckCheck className="h-3 w-3 text-gray-300" /> : 
                      <Check className="h-3 w-3 text-gray-400" />
                    )}
                  </span>
                )}
              </div>
              {!msg.is_deleted && msg.id && (
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <button onClick={() => setShowDeleteModal(msg)} className="p-2 text-gray-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {isTyping && <div className="flex items-start animate-pulse text-gray-500 text-sm ml-2">Typing...</div>}
      <div ref={messagesEndRef} />
    </div>
  );
}