import { X, Camera } from 'lucide-react';

export default function ProfileModal({
  user,
  editName,
  setEditName,
  setShowProfileModal,
  profilePicRef,
  handleAvatarUpload,
  handleProfileUpdate
}) {
  return (
    <div className="absolute inset-0 bg-dark-900/80 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-dark-800 p-8 rounded-3xl border border-gray-700 w-96 shadow-2xl relative">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Profile Settings</h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative group cursor-pointer" onClick={() => profilePicRef.current.click()}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="h-24 w-24 rounded-full object-cover border-4 border-dark-900 shadow-lg group-hover:opacity-50 transition" />
            ) : (
              <div className="h-24 w-24 bg-brand-500 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg group-hover:opacity-50 transition">
                {user?.full_name?.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          <input type="file" accept="image/*" ref={profilePicRef} onChange={handleAvatarUpload} className="hidden" />
        </div>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Display Name</label>
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              className="w-full bg-dark-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500" 
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}