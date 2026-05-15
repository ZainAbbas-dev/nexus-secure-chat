import { useState, useRef, useEffect } from 'react';

const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export const useWebRTC = (socket, user, room) => {
  const [callStatus, setCallStatus] = useState('idle');
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const callRoomRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setIncomingCallData(data);
      setCallStatus('receiving');
    };

    const handleCallAccepted = async (answer) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('active');
      }
    };

    const handleReceiveIceCandidate = async (candidate) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleCallEnded = () => {
      endCallLocal();
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("receive_ice_candidate", handleReceiveIceCandidate);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("receive_ice_candidate", handleReceiveIceCandidate);
      socket.off("call_ended", handleCallEnded);
    };
  }, [socket]);

  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && callRoomRef.current) {
        socket.emit("ice_candidate", { room: callRoomRef.current, candidate: event.candidate });
      }
    };
    
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    
    peerConnectionRef.current = pc;
    return pc;
  };

  const getMedia = async (videoEnabled = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Media devices error:", err);
      return null;
    }
  };

  const startCall = async (videoEnabled = true) => {
    if (!room || !socket || !user) return;
    
    setCallStatus('calling');
    callRoomRef.current = room;
    
    const stream = await getMedia(videoEnabled);
    if (!stream) {
      setCallStatus('idle');
      callRoomRef.current = null;
      return;
    }
    
    const pc = setupPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit("call_user", { 
      room, 
      from: user.full_name, 
      offer, 
      type: videoEnabled ? 'video' : 'audio' 
    });
  };

  const acceptCall = async () => {
    if (!incomingCallData || !socket || !room) return;
    
    callRoomRef.current = room;
    const useVideo = incomingCallData.type === 'video';
    
    const stream = await getMedia(useVideo);
    if (!stream) return;
    
    const pc = setupPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit("answer_call", { room, answer });
    setCallStatus('active');
  };

  const endCallLocal = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setIncomingCallData(null);
    callRoomRef.current = null;
  };

  const endCallNetwork = () => {
    endCallLocal();
    if (socket && room) {
      socket.emit("end_call", room);
    }
  };

  return {
    callStatus,
    incomingCallData,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    endCallLocal,
    endCallNetwork
  };
};