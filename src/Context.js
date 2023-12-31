import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// const socket = io('http://localhost:5000');
const socket = io('https://vchatserver-g60f.onrender.com');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // useEffect(() => {
  //   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  //     .then((currentStream) => {
  //       setStream(currentStream);

  //       myVideo.current.srcObject = currentStream;
  //     });

  //   socket.on('me', (id) => setMe(id));

  //   socket.on('callUser', ({ from, name: callerName, signal }) => {
  //     setCall({ isReceivingCall: true, from, name: callerName, signal });
  //   });
  // }, []);

  useEffect(() => {
    /*navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.msGetUserMedia || navigator.mediaDevices.oGetUserMedia;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
  
        // if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        // }
      });
  */
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
   
        myVideo.current.srcObject = currentStream;
        console.log("stream in =>",currentStream);

      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
      });
      if(myVideo.current.stream)
      {
        setStream(myVideo.current.stream);
        console.log("stream=>",stream);
      }
      console.log("call=>",myVideo.current);
    socket.on('me', (id) => setMe(id));
  
    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);
  

  const answerCall = () => {
    setCallAccepted(true);
  
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream:myVideo.current.stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }, // Example STUN server
          // Add more STUN or TURN servers as needed
        ],
      },
    });
  
    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });
  
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
  
    peer.signal(call.signal);
  
    connectionRef.current = peer;
  };
  
  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream:myVideo.current.stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }, // Example STUN server
          // Add more STUN or TURN servers as needed
        ],
      },
    });
  
    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    });
  
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
  
    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
  
      peer.signal(signal);
    });
  
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
