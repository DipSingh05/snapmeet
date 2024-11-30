import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import EmojiPicker from "emoji-picker-react";
import "./App.css"; // Add CSS for animations and colors

function Home() {
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [callInput, setCallInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [transScript, setTransScript] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTranslateMessages, setisTranslateMessages] = useState(false);
  const [pendingCaller, setPendingCaller] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  // Refs for stable references
  const connectedUser = useRef("");
  const callerName = useRef("");
  const conn = useRef(null);
  const yourConn = useRef(null);
  const stream = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isTranslateMessagesRef = useRef(isTranslateMessages);

  const { transcript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // Sync isTranslateMessages state with ref
  useEffect(() => {
    isTranslateMessagesRef.current = isTranslateMessages;
  }, [isTranslateMessages]);

  useEffect(() => {
    conn.current = new WebSocket("ws://localhost:9090");

    conn.current.onopen = () => console.log("Connected to the signaling server");

    conn.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      switch (data.type) {
        case "login":
          handleLogin(data.success);
          break;
        case "offer":
          handleOffer(data.offer, data.name);
          break;
        case "answer":
          handleAnswer(data.answer);
          break;
        case "candidate":
          handleCandidate(data.candidate);
          break;
        case "reject":
          alert("Your call was rejected.");
          handleLeave();
          break;
        case "message":
          handleIncomingMessage(data.message, data.transmsg);
          break;
        case "transcript":
          handleTranscription(data.message, data.transmsg);
          break;
        case "file":
          handleIncomingFile(data.file, data.fileName);
          break;
        case "leave":
          alert(`${connectedUser.current} has left the call.`);
          handleLeave();
          break;
        default:
          break;
      }
    };

    conn.current.onerror = (err) => console.error("WebSocket error:", err);

  }, []);

  useEffect(() => {
    let timer;
    if (isCallActive) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const send = (message) => {
    if (!conn.current || conn.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected.");
      return;
    }
    if (connectedUser.current) message.name = connectedUser.current;
    conn.current.send(JSON.stringify(message));
  };

  const handleAccess = () => {
    if (loginInput.trim()) {
      setName(loginInput);
      send({ type: "login", name: loginInput, language: selectedLanguage });
    }
  };

  const handleLogin = (success) => {
    if (!success) {
      alert("Try a different username.");
    } else {
      setIsLogin(true);
  
      // Attempt to get user media with both video and audio
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: { echoCancellation: true } })
        .then((myStream) => {
          initializeConnection(myStream);
        })
        .catch((error) => {
          console.warn("Media device error:", error);
          alert(
            "No camera or microphone detected. You can still join the call without media."
          );
          // Initialize connection without media stream
          initializeConnection(null);
        });
    }
  };
  
  const initializeConnection = (myStream) => {
    stream.current = myStream;
  
    if (myStream && localVideoRef.current) {
      localVideoRef.current.srcObject = myStream;
    } else if (localVideoRef.current) {
      localVideoRef.current.poster = "/public/vite.svg"; // Placeholder image
    }
    
  
    const configuration = {
      iceServers: [{ urls: "stun:stun2.1.google.com:19302" }],
    };
    yourConn.current = new RTCPeerConnection(configuration);
  
    if (myStream) {
      yourConn.current.addStream(myStream);
    }

    yourConn.current.onaddstream = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.stream;
    };
  
    yourConn.current.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: "candidate", candidate: event.candidate });
      }
    };
  };
  


  const handleCall = () => {
    const callToUsername = callInput.trim();
    if (callToUsername === name) {
      alert("You cannot call yourself!");
      return;
    }

    if (isCallActive) {
      alert("You are already in a call!");
      return;
    }

    if (callToUsername.length > 0) {
      connectedUser.current = callToUsername;
      yourConn.current
        .createOffer()
        .then((offer) => {
          yourConn.current.setLocalDescription(offer);
          send({ type: "offer", offer: offer });
        })
        .catch((err) => console.error("Error creating an offer:", err));
    }
  };

  const handleOffer = async (offer, name) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null; // Clear previous remote stream
    }

    if (isCallActive) {
      setPendingCaller({ offer, name });
      alert(`${name} is calling you. Finish your current call or accept the new call.`);
      return;
    }
    connectedUser.current = name;
    callerName.current = name;
    await yourConn.current.setRemoteDescription(new RTCSessionDescription(offer));
    setIsIncoming(true);
  };

  const handleAnswer = (answer) => {
    if (yourConn.current) {
      yourConn.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
    setIsCallActive(true);
  };

  const handleCandidate = (candidate) => {
    if (yourConn.current.remoteDescription) {
      yourConn.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleLeave = () => {
    connectedUser.current = "";
    setIsCallActive(false);
    setCallDuration(0);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (yourConn.current) {
      yourConn.current.close();
      yourConn.current.onicecandidate = null;
      yourConn.current.onaddstream = null;
    }

    if (pendingCaller) {
      const { offer, name } = pendingCaller;
      setPendingCaller(null);
      handleOffer(offer, name);
    }
  };

  const toggleVideo = () => {
    const videoTrack = stream.current.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
  };

  const toggleAudio = () => {
    console.log(stream.current.getAudioTracks());
    const audioTrack = stream.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
  };

  const sendMessage = () => {
    if (connectedUser.current) {
      send({ type: "message", message: chatInput, senderLanguage: selectedLanguage });
      setMessages((prev) => [...prev, { sender: "You", text: chatInput }]);
      setChatInput("");
    }
  };

  const handleAcceptCall = () => {
    if (isCallActive) {
      handleLeave();
    }
    connectedUser.current = callerName.current;
    if (yourConn.current) {
      yourConn.current
        .createAnswer()
        .then((answer) => {
          yourConn.current.setLocalDescription(answer);
          send({ type: "answer", answer: answer });
        })
        .catch((err) => console.error("Error creating answer:", err));
    }
    setIsIncoming(false);
    setIsCallActive(true);
    setPendingCaller(null);
  };

  const handleRejectCall = () => {
    send({ type: "reject" });
    setIsIncoming(false);
    connectedUser.current = "";
  };

  const handleIncomingMessage = (message, translateMessage) => {
    if (isTranslateMessagesRef.current) {
      setMessages((prev) => [...prev, { sender: connectedUser.current, text: translateMessage }]);
    } else {
      setMessages((prev) => [...prev, { sender: connectedUser.current, text: message }]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      send({ type: "file", file: reader.result, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleIncomingFile = (file, fileName) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: connectedUser.current,
        text: (
          <a href={file} download={fileName}>
            {fileName}
          </a>
        ),
      },
    ]);
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      yourConn.current.addTrack(screenStream.getVideoTracks()[0], screenStream);
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const startTranscription = () => {
    if (!browserSupportsSpeechRecognition) {
      return alert("Your browser does not support speech recognition.");
    }

    // Start listening with continuous mode
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language: selectedLanguage,
    });
  };

  // useEffect to send transcript updates whenever it changes
  useEffect(() => {
    if (transcript) {
      // Send the updated transcript to the server
      send({
        type: "transcript",
        message: transcript,
        senderLanguage: selectedLanguage,
      });

      // Update the transcription state with the new transcript
      setTransScript((prev) => [
        { sender: "You", text: transcript, isTranscription: isTranslateMessages },
      ]);

    }
  }, [transcript]);  // This effect runs whenever `transcript` changes

  const stopTranscription = () => {
    // Stop listening
    SpeechRecognition.stopListening();
  };

  const handleTranscription = (message, translateMessage) => {
    if (isTranslateMessagesRef.current) {
      setTransScript((prev) => [{ sender: connectedUser.current, text: translateMessage }]);
    } else {
      setTransScript((prev) => [{ sender: connectedUser.current, text: message }]);
    }
  };

  const handleEmojiClick = (emoji) => {
    setChatInput((prevInput) => prevInput + emoji.emoji);
  };

  return (
    <div>
      {!isLogin ? (
        <div>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
          />
          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
            <option value="en" defaultValue="en">English</option>
            <option value="bn">Bengali</option>
            <option value="gu">Gujarati</option>
            <option value="hi">Hindi</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
            <option value="mr">Marathi</option>
            <option value="ne">Nepali</option>
            <option value="ma">Punjabi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="ur">Urdu</option>

          </select>
          <button onClick={handleAccess}>Login</button>
        </div>
      ) : (
        <div>
          {isIncoming && (
            <div>
              <p>{callerName.current} is calling...</p>
              <button onClick={handleAcceptCall}>Accept</button>
              <button onClick={handleRejectCall}>Reject</button>
            </div>
          )}
          <div>
            <video ref={localVideoRef} autoPlay width={280} />
            <video ref={remoteVideoRef} autoPlay width={280} />
          </div>
          <div>Call Duration: {Math.floor(callDuration / 60)}:{callDuration % 60}</div>
          <div>
            <h3>Transcript</h3>
            <ul>
              {transScript.map((msg, index) => (
                <li key={index}>
                  <b>{msg.sender}:</b> {msg.text}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <input
              type="text"
              value={callInput}
              onChange={(e) => setCallInput(e.target.value)}
              placeholder="Enter username to call"
              disabled={isCallActive}
            />
            <button onClick={handleCall} disabled={isCallActive}>Call</button>
            <button onClick={handleLeave}>Hang Up</button>
            <button onClick={toggleVideo}>Toggle Video</button>
            <button onClick={toggleAudio}>Toggle Audio</button>
            <button onClick={startScreenShare}>Share Screen</button>
            <button onClick={startTranscription}>Start Transcription</button>
            <button onClick={stopTranscription}>Stop Transcription</button>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={isTranslateMessages}
                onChange={() => setisTranslateMessages(!isTranslateMessages)}
              />
              Translate Messages: {isTranslateMessages ? "On" : "Off"}
            </label>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message"
            />
            <button onClick={sendMessage} disabled={chatInput !== '' ? false : true}>Send</button>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
            {showEmojiPicker && (
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            )}
          </div>
          <input type="file" onChange={handleFileUpload} />
          <div>
            <h3>Messages</h3>
            <ul>
              {messages.map((msg, index) => (
                <li key={index}>
                  <b>{msg.sender}:</b> {msg.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
