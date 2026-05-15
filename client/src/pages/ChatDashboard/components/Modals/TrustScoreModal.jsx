import { X, ShieldCheck, Shield, ShieldAlert, Check, BadgeCheck } from 'lucide-react';

export default function TrustScoreModal({
  setShowTrustModal,
  trustData,
  shieldColor,
  activeChat
}) {
  return (
    <div className="absolute inset-0 bg-dark-900/80 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-dark-800 p-8 rounded-3xl border border-gray-700 w-[400px] shadow-2xl relative text-center">
        <button onClick={() => setShowTrustModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition"><X className="h-5 w-5"/></button>
        
        <div className="flex justify-center mb-4">
            {trustData.score >= 75 ? <ShieldCheck className="h-16 w-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" /> : trustData.score >= 40 ? <Shield className="h-16 w-16 text-yellow-500" /> : <ShieldAlert className="h-16 w-16 text-gray-500" />}
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-1">Trust Score: {trustData.score}%</h2>
        <p className={`text-sm font-semibold mb-6 ${shieldColor}`}>{trustData.level}</p>

        <div className="bg-dark-900 rounded-2xl p-5 text-left space-y-4 mb-6 border border-gray-800">
          <div className="flex justify-between text-sm items-center"><span className="text-gray-400">Interaction History</span><span className="text-white font-medium bg-dark-800 px-3 py-1 rounded-lg">{trustData.count} Messages</span></div>
          <div className="flex justify-between text-sm items-center"><span className="text-gray-400">E2EE Secured</span><span className="text-white font-medium flex items-center gap-1"><Check className="h-4 w-4 text-green-500"/> Yes</span></div>
          <div className="flex justify-between text-sm items-center"><span className="text-gray-400">Identity Badge</span><span className="text-white font-medium">{trustData.score >= 75 || activeChat?.is_verified ? <span className="flex items-center gap-1 text-blue-400"><BadgeCheck className="h-4 w-4"/> Verified</span> : 'Unverified'}</span></div>
        </div>
        
        <p className="text-xs text-gray-500 leading-relaxed">
          Trust scores are calculated locally using end-to-end encryption metadata and cryptographic interaction length.
        </p>
      </div>
    </div>
  );
}