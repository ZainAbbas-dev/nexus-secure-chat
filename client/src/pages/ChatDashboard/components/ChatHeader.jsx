import { User as UserIcon, BadgeCheck, Shield, Video, Phone, PenTool, Terminal, Trash2 } from 'lucide-react';

export default function ChatHeader({
  activeChat,
  trustData,
  shieldBg,
  shieldColor,
  callStatus,
  setShowTrustModal,
  startCall,
  setShowWhiteboard,
  setShowCodeEditor,
  setShowClearChatModal
}) {
  return (
    <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-dark-800 shadow-sm">
      <div className="flex items-center gap-3 cursor-pointer hover:bg-dark-800 p-1.5 rounded-lg transition" onClick={() => setShowTrustModal(true)}>
          <div className="relative">
            {activeChat.avatar ? (
              <img src={activeChat.avatar} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center"><UserIcon className="h-5 w-5 text-gray-300" /></div>
            )}
            {trustData.score >= 75 && <div className="absolute -bottom-1 -right-1 bg-dark-800 rounded-full p-0.5"><BadgeCheck className="h-4 w-4 text-blue-500" /></div>}
          </div>
          <div className="flex flex-col">
            <h2 className="font-semibold text-lg leading-tight flex items-center gap-1">{activeChat.full_name}</h2>
            <div className={`text-[10px] font-medium flex items-center gap-1 w-fit px-1.5 rounded-full border ${shieldBg} ${shieldColor}`}>
              <Shield className="h-3 w-3" /> {trustData.level}
            </div>
          </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {callStatus === 'idle' && (
          <>
            <button onClick={() => startCall(true)} className="text-gray-400 hover:text-brand-500 transition" title="Video Call"><Video className="h-5 w-5" /></button>
            <button onClick={() => startCall(false)} className="text-gray-400 hover:text-brand-500 transition" title="Audio Call"><Phone className="h-5 w-5" /></button>
            <div className="h-6 w-px bg-gray-700 mx-1"></div>
            <button onClick={() => setShowWhiteboard(true)} className="text-gray-400 hover:text-purple-400 transition" title="Open Whiteboard"><PenTool className="h-5 w-5" /></button>
            <button onClick={() => setShowCodeEditor(true)} className="text-gray-400 hover:text-green-400 transition" title="Live Code Editor"><Terminal className="h-5 w-5" /></button>
            <button onClick={() => setShowClearChatModal(true)} className="text-gray-400 hover:text-red-500 transition" title="Clear Chat"><Trash2 className="h-5 w-5" /></button>
          </>
        )}
      </div>
    </div>
  );
}