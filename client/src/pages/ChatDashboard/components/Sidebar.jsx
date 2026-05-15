import { Settings, LogOut, User as UserIcon, BadgeCheck } from 'lucide-react';

export default function Sidebar({ 
  user, 
  users, 
  activeChat, 
  setActiveChat, 
  callStatus, 
  onlineUsersSet, 
  setShowProfileModal, 
  handleLogout 
}) {
  return (
    <div className="w-1/3 max-sm:w-full max-w-sm border-r border-gray-800 flex flex-col bg-dark-900 z-10">
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-dark-800">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setShowProfileModal(true)}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="h-10 w-10 rounded-full object-cover border border-gray-600 group-hover:opacity-75 transition" />
            ) : (
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center font-bold group-hover:opacity-75 transition">
                {user?.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <span className="font-semibold truncate w-24">{user?.full_name || 'User'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfileModal(true)} className="text-gray-400 hover:text-white transition p-2"><Settings className="h-5 w-5" /></button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition p-2"><LogOut className="h-5 w-5" /></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contacts</h3>
        {users.map((contact) => (
          <div 
            key={contact.id}
            onClick={() => { if(callStatus === 'idle') setActiveChat(contact); }}
            className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center gap-3 ${activeChat?.id === contact.id ? 'bg-brand-500/20 border-brand-500' : 'bg-dark-800 border-transparent hover:border-gray-700'} ${callStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="relative">
              {contact.avatar ? (
                <img src={contact.avatar} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center"><UserIcon className="h-5 w-5 text-gray-300" /></div>
              )}
              {onlineUsersSet.has(contact.email?.toLowerCase()) && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark-900"></div>
              )}
              {contact.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-dark-900 rounded-full p-0.5"><BadgeCheck className="h-3 w-3 text-blue-400" /></div>
              )}
            </div>
            <h4 className="font-medium text-white">{contact.full_name}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}