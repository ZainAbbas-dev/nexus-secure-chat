import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import CryptoJS from 'crypto-js';

// Custom Hooks
import { useWebRTC } from './hooks/useWebRTC';
import { useWhiteboard } from './hooks/useWhiteboard';

// UI Components
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';

// Modals & Overlays
import ProfileModal from './components/Modals/ProfileModal';
import TrustScoreModal from './components/Modals/TrustScoreModal';
import CallOverlay from './components/Modals/CallOverlay';
import Whiteboard from './components/Whiteboard';
import LiveCodeEditor from './components/LiveCodeEditor';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getRoomKey = (roomId) => CryptoJS.HmacSHA256(roomId, "nexus_prime_2026_secure_layer").toString();

const generateRoomId = (me, them) => {
  const id1 = String(me?.email || me?.username || me?.full_name || me?.id).toLowerCase();
  const id2 = String(them?.email || them?.username || them?.full_name || them?.id).toLowerCase();
  return [id1, id2].sort().join('_');
};

const isSpam = (text) => /(?:verify.*account|update.*payment|password.*reset|crypto.*giveaway|click.*link.*win|http:\/\/\d+\.\d+\.\d+\.\d+|free.*money)/i.test(text || "");

export default function ChatDashboard() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('nexus_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [room, setRoom] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || "");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [liveCode, setLiveCode] = useState("// Write your code here...");
  const [trustData, setTrustData] = useState({ score: 0, level: 'New Contact', count: 0 });
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [onlineUsersSet, setOnlineUsersSet] = useState(new Set());

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profilePicRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Custom Hooks
  const { callStatus, incomingCallData, localStream, remoteStream, startCall, acceptCall, endCallLocal, endCallNetwork } = useWebRTC(socket, user, room);
  const { canvasRef, showWhiteboard, setShowWhiteboard, brushColor, setBrushColor, startDrawing, stopDrawing, draw, clearCanvas } = useWhiteboard(socket, room, room ? getRoomKey(room) : null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const decryptMessage = (ciphertext, roomId) => {
    if (!ciphertext || !ciphertext.startsWith("U2Fsd") || !roomId) return ciphertext || "";
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, getRoomKey(roomId));
      return bytes.toString(CryptoJS.enc.Utf8) || "[Decryption Error]"; 
    } catch (err) { return "[Decryption Error]"; }
  };

  useEffect(() => { if (!user) navigate('/'); }, [user, navigate]);

  useEffect(() => {
    if (!user) return; 
    const newSocket = io(API_URL);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [user]);

  useEffect(() => {
    if (!socket || !user?.email) return;
    const registerUser = () => socket.emit('register_user', user.email);
    registerUser();
    socket.on('connect', registerUser);

    socket.on('online_users', (emails) => setOnlineUsersSet(new Set(emails.map(e => e.toLowerCase()))));
    socket.on('user_online', (email) => setOnlineUsersSet(prev => new Set(prev).add(email.toLowerCase())));
    socket.on('user_offline', (email) => setOnlineUsersSet(prev => { const newSet = new Set(prev); newSet.delete(email.toLowerCase()); return newSet; }));

    return () => {
      socket.off('connect', registerUser);
      socket.off('online_users'); socket.off('user_online'); socket.off('user_offline');
    };
  }, [socket, user]);

  useEffect(() => {
    if (!user?.email) return;
    axios.get(`${API_URL}/api/users`).then(res => setUsers(res.data.filter(u => u.email !== user.email))).catch(()=>{});
  }, [user?.email, showProfileModal]);

  useEffect(() => {
    if (!activeChat || !socket || !user) return;
    const roomId = generateRoomId(user, activeChat);
    setRoom(roomId);
    socket.emit("join_room", roomId);

    axios.get(`${API_URL}/api/messages/${roomId}`).then(res => setMessages(res.data.map(msg => ({ ...msg, message: decryptMessage(msg.message, roomId) })))).catch(()=>{});
    axios.get(`${API_URL}/api/trust/${roomId}`).then(res => setTrustData(res.data)).catch(()=>{});
    
    return () => {
      socket.emit("leave_room", roomId);
      setMessages([]); setShowWhiteboard(false); setShowCodeEditor(false); setTrustData({ score: 0, level: 'New Contact', count: 0 });
    };
  }, [activeChat, user?.email, socket]); 

  useEffect(() => {
    if (!activeChat || !socket || !room || messages.length === 0) return;
    let hasChanges = false;
    const updatedMessages = messages.map(msg => {
      if (msg.author !== user?.full_name && msg.status !== 'read' && msg.id) {
        hasChanges = true;
        socket.emit("message_read", { room, messageId: msg.id, tempId: msg.tempId });
        return { ...msg, status: 'read' };
      }
      return msg;
    });
    if (hasChanges) setMessages(updatedMessages);
  }, [messages, activeChat, socket, room, user?.full_name]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("receive_message", (data) => {
      const correctRoomId = data.room_id || data.room || room;
      setMessages(prev => [...prev, { ...data, message: decryptMessage(data.message, correctRoomId) }]);
      if (data.author !== user.full_name && data.id) {
        socket.emit("message_delivered", { room: correctRoomId, messageId: data.id, tempId: data.tempId });
        if (correctRoomId === room) {
          socket.emit("message_read", { room: correctRoomId, messageId: data.id, tempId: data.tempId });
          setTrustData(prev => ({ ...prev, count: prev.count + 1 }));
        }
      }
    });
    
    socket.on("message_delivered", ({ id, tempId }) => setMessages(prev => prev.map(msg => (msg.id === id || msg.tempId === tempId) && msg.status !== 'read' ? { ...msg, status: 'delivered' } : msg)));
    socket.on("message_read", ({ id, tempId }) => setMessages(prev => prev.map(msg => (msg.id === id || msg.tempId === tempId) ? { ...msg, status: 'read' } : msg)));
    socket.on("message_deleted_everyone", (id) => setMessages(prev => prev.map(msg => (msg.id === id || msg.tempId === id) ? { ...msg, is_deleted: true, message: '[DELETED]' } : msg)));
    socket.on("receive_code_update", (code) => setLiveCode(code));
    socket.on("user_typing", () => setIsTyping(true));
    socket.on("user_stopped_typing", () => setIsTyping(false));

    return () => { 
      socket.off("receive_message"); socket.off("message_delivered"); socket.off("message_read"); 
      socket.off("message_deleted_everyone"); socket.off("receive_code_update"); socket.off("user_typing"); socket.off("user_stopped_typing"); 
    };
  }, [room, user?.full_name, socket]);

  useEffect(() => scrollToBottom(), [messages, isTyping]);
  useEffect(() => { return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); }; }, []);

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    if (!room || !socket) return;
    socket.emit("typing", room);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit("stop_typing", room), 1500);
  };

  const emitMessage = async (messageContent) => {
    const timeString = `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`;
    const messageData = { room, author: user?.full_name || 'Unknown', message: CryptoJS.AES.encrypt(messageContent, getRoomKey(room)).toString(), time: timeString, tempId: Date.now().toString() + Math.random().toString(), status: 'sent' };

    socket.emit("send_message", messageData, (serverMessage) => {
      if(serverMessage) {
        setMessages(prev => prev.map(msg => {
          if (msg.tempId === messageData.tempId) {
            return { ...serverMessage, message: messageContent, status: (msg.status === 'read' || msg.status === 'delivered') ? msg.status : serverMessage.status };
          }
          return msg;
        }));
      }
    });
    setMessages((prev) => [...prev, { ...messageData, message: messageContent }]);
    setTrustData(prev => ({ ...prev, count: prev.count + 1 })); 
  };

  const sendMessage = async (e) => { e.preventDefault(); if (currentMessage.trim() !== "" && room && socket) { await emitMessage(currentMessage); setCurrentMessage(""); socket.emit("stop_typing", room); }};
  const handleFileUpload = async (e) => { const file = e.target.files[0]; if (!file || !room) return; const formData = new FormData(); formData.append('file', file); try { const res = await axios.post(`${API_URL}/api/upload`, formData); await emitMessage(res.data.url); } catch (err) {} };
  const handleLogout = () => { localStorage.clear(); if (socket) socket.disconnect(); navigate('/'); };
  const handleDeleteMessage = (type) => { if (!showDeleteModal || !socket) return; const msgId = showDeleteModal.id || showDeleteModal.tempId; socket.emit('delete_message', { messageId: msgId, type, requester: user.full_name, room }); if (type === 'me') setMessages(prev => prev.map(m => (m.id === msgId || m.tempId === msgId) ? { ...m, deleted_for: [...(m.deleted_for || []), user.full_name] } : m)); else if (type === 'everyone') setMessages(prev => prev.map(m => (m.id === msgId || m.tempId === msgId) ? { ...m, is_deleted: true, message: '[DELETED]' } : m)); setShowDeleteModal(null); };
  const handleClearChat = () => { socket.emit("clear_chat", { room, requester: user.full_name }); setMessages([]); setShowClearChatModal(false); };
  const handleProfileUpdate = async (e) => { e.preventDefault(); try { const res = await axios.put(`${API_URL}/api/users/profile`, { email: user.email, full_name: editName, avatar: user.avatar || '' }); const updatedUser = { ...user, ...res.data }; localStorage.setItem('nexus_user', JSON.stringify(updatedUser)); setUser(updatedUser); setShowProfileModal(false); } catch (err) {} };
  const handleAvatarUpload = async (e) => { const file = e.target.files[0]; if (!file) return; const formData = new FormData(); formData.append('file', file); try { const res = await axios.post(`${API_URL}/api/upload`, formData); const updatedUser = { ...user, avatar: res.data.url }; localStorage.setItem('nexus_user', JSON.stringify(updatedUser)); setUser(updatedUser); await axios.put(`${API_URL}/api/users/profile`, { email: user.email, full_name: user.full_name, avatar: res.data.url }); } catch (err) {} };

  if (!user) return null; 

  const shieldColor = trustData.score >= 75 ? 'text-green-400' : trustData.score >= 40 ? 'text-yellow-400' : 'text-gray-400';
  const shieldBg = trustData.score >= 75 ? 'bg-green-500/10 border-green-500/20' : trustData.score >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-gray-500/10 border-gray-500/20';

  return (
    <div className="flex h-screen bg-dark-900 text-white overflow-hidden relative">
      
      <Sidebar user={user} users={users} activeChat={activeChat} setActiveChat={setActiveChat} callStatus={callStatus} onlineUsersSet={onlineUsersSet} setShowProfileModal={setShowProfileModal} handleLogout={handleLogout} />

      <div className={`flex-1 flex flex-col bg-dark-900/95 transition-all z-10 ${!activeChat ? 'max-sm:hidden' : ''}`}>
        {activeChat ? (
          <>
            <ChatHeader activeChat={activeChat} trustData={trustData} shieldBg={shieldBg} shieldColor={shieldColor} callStatus={callStatus} setShowTrustModal={setShowTrustModal} startCall={startCall} setShowWhiteboard={setShowWhiteboard} setShowCodeEditor={setShowCodeEditor} setShowClearChatModal={setShowClearChatModal} />
            <MessageList messages={messages} user={user} isTyping={isTyping} messagesEndRef={messagesEndRef} API_URL={API_URL} isSpam={isSpam} setShowDeleteModal={setShowDeleteModal} setShowCodeEditor={setShowCodeEditor} />
            <MessageInput currentMessage={currentMessage} handleTyping={handleTyping} sendMessage={sendMessage} fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} insertCodeTemplate={() => { setCurrentMessage("LIVE_CODE_BLOCK"); setShowCodeEditor(true); }} activeChat={activeChat} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500"><MessageSquare className="h-16 w-16 mb-4 opacity-20" /><h2 className="text-xl font-semibold">Nexus Secure</h2></div>
        )}
      </div>

      {showTrustModal && <TrustScoreModal setShowTrustModal={setShowTrustModal} trustData={trustData} shieldColor={shieldColor} activeChat={activeChat} />}
      {showCodeEditor && <LiveCodeEditor setShowCodeEditor={setShowCodeEditor} liveCode={liveCode} handleCodeChange={(val) => { setLiveCode(val); socket.emit("code_update", { room, code: val }); }} />}
      {showWhiteboard && <Whiteboard setShowWhiteboard={setShowWhiteboard} brushColor={brushColor} setBrushColor={setBrushColor} clearCanvas={clearCanvas} canvasRef={canvasRef} startDrawing={startDrawing} draw={draw} stopDrawing={stopDrawing} />}
      {showClearChatModal && (
        <div className="absolute inset-0 bg-dark-900/80 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-dark-800 p-6 rounded-3xl border border-gray-700 text-center flex flex-col items-center w-80 shadow-2xl"><h3 className="text-lg font-bold text-white mb-2">Clear this chat?</h3><p className="text-sm text-gray-400 mb-6">Messages will only be removed from your device.</p><div className="flex flex-col gap-3 w-full"><button onClick={handleClearChat} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition">Clear chat</button><button onClick={() => setShowClearChatModal(false)} className="w-full bg-dark-700 hover:bg-dark-600 text-white py-3 rounded-xl font-medium transition">Cancel</button></div></div>
        </div>
      )}
      {showProfileModal && <ProfileModal user={user} editName={editName} setEditName={setEditName} setShowProfileModal={setShowProfileModal} profilePicRef={profilePicRef} handleAvatarUpload={handleAvatarUpload} handleProfileUpdate={handleProfileUpdate} />}
      {showDeleteModal && (
        <div className="absolute inset-0 bg-dark-900/70 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-dark-800 p-6 rounded-3xl border border-gray-700 text-center flex flex-col items-center w-80 shadow-2xl"><h3 className="text-lg font-bold text-white mb-6">Delete Message?</h3><div className="flex flex-col gap-3 w-full">{showDeleteModal.author === user?.full_name && <button onClick={() => handleDeleteMessage('everyone')} className="w-full bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-3 rounded-xl font-medium transition">Delete for everyone</button>}<button onClick={() => handleDeleteMessage('me')} className="w-full bg-dark-700 hover:bg-dark-600 text-white py-3 rounded-xl font-medium transition">Delete for me</button><button onClick={() => setShowDeleteModal(null)} className="w-full bg-transparent text-gray-400 hover:text-white py-2 mt-2 transition">Cancel</button></div></div>
        </div>
      )}
      <CallOverlay callStatus={callStatus} incomingCallData={incomingCallData} endCallLocal={endCallLocal} acceptCall={acceptCall} remoteVideoRef={remoteVideoRef} localStream={localStream} localVideoRef={localVideoRef} endCallNetwork={endCallNetwork} />
    </div>
  );
}