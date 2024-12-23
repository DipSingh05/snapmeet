import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import EmojiPicker from "emoji-picker-react";

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
    conn.current = new WebSocket(`ws://${window.location.hostname}:9090`);

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

  const handleLogin = async (success) => {
    if (!success) {
      alert("Try a different username.");
      return;
    }

    setIsLogin(true);

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoInput = devices.some(device => device.kind === "videoinput");
      const hasAudioInput = devices.some(device => device.kind === "audioinput");
    
      // Set constraints based on available devices
      const constraints = {
        video: hasVideoInput,
        audio: hasAudioInput ? { echoCancellation: true } : false,
      };
    
      let myStream = null;
      if (hasVideoInput || hasAudioInput) {
        myStream = await navigator.mediaDevices.getUserMedia(constraints);
      }
    
      // If the user has a mic but no camera, create a fake video stream
      if (hasAudioInput && !hasVideoInput) {
        const fakeVideoStream = await createFakeVideoStream();
        if (fakeVideoStream) {
          console.log("Fake video created for audio-only user.");
          initializeConnection(myStream, fakeVideoStream);
        }
        return;
      }
    
      // If the user has both mic and camera, proceed with the stream
      if (myStream) {
        console.log("Using real media stream.");
        initializeConnection(myStream, null);
        return;
      }
    
      // If the user has no mic or camera, show an alert and join without media
      alert("No camera or microphone detected. Joining without media.");
      const fakeVideoStream = await createFakeVideoStream();
      if (fakeVideoStream) {
        console.log("Joining without media using a fake video stream.");
        initializeConnection(null, fakeVideoStream);
      }
    } catch (error) {
      console.warn("Media device error:", error);
      alert("An error occurred while accessing media devices. Joining without media.");
    
      const fakeVideoStream = await createFakeVideoStream();
      if (fakeVideoStream) {
        console.log("Joining without media using a fake video stream.");
        initializeConnection(null, fakeVideoStream);
      }
    }
    
  };

  const initializeConnection = async (myStream, fakeVideoStream) => {
    
    if (!myStream) return;

    stream.current = myStream;

    const hasVideoTrack = myStream.getVideoTracks().length > 0;
    if (myStream && localVideoRef.current) {
        // Ensure the stream is fully ready before processing it
        if (myStream.getTracks().length > 0) {
            // Handle Audio Tracks
            const audioTrack = myStream.getAudioTracks()[0];
            if (audioTrack) {
                const audio = new Audio();
                audio.srcObject = new MediaStream([audioTrack]);
                audio.play().catch((err) => console.error("Audio playback error:", err));
            }

            // Handle Video Tracks
            if (hasVideoTrack) {
                localVideoRef.current.poster = "";
                localVideoRef.current.srcObject = myStream;
            } else {
                localVideoRef.current.poster = "";
                localVideoRef.current.srcObject = fakeVideoStream;
            }
        } else {
            console.error('No tracks found in the stream');
        }
    }

    const configuration = {
        iceServers: [{ urls: "stun:stun2.1.google.com:19302" }],
    };
    yourConn.current = new RTCPeerConnection(configuration);

    // If no video track, create a fake video stream
    if (!hasVideoTrack) {
        fakeVideoStream.getTracks().forEach((track) => {yourConn.current.addTrack(track, fakeVideoStream)
        });
        
    }

    if (myStream) {
        myStream.getTracks().forEach(track => {yourConn.current.addTrack(track, myStream)
        });
       
    }

    yourConn.current.onicecandidate = (event) => {
      if (event.candidate) {
          send({ type: "candidate", candidate: event.candidate });
      }
  };

    

    yourConn.current.ontrack = (event) => {
        const [remoteStream] = event.streams;

        if (remoteStream) {
            // Check and handle video track for remote stream
            const videoTrack = remoteStream.getVideoTracks()[0];
            if (videoTrack) {
                remoteVideoRef.current.srcObject = remoteStream;
            } else {
                remoteVideoRef.current.srcObject = null;
            }

            // Handle audio track for remote stream
            const audioTrack = remoteStream.getAudioTracks()[0];
            if (audioTrack) {
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.play().catch((err) => console.error("Audio playback error:", err));
            }
        }
    };

};

const createFakeVideoStream = () => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = 640;
        canvas.height = 480;

        context.fillStyle = "#000000";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#FFFFFF";
        context.font = "30px Arial";
        context.fillText("No Video", 200, 200);

        // Create a MediaStream from the canvas
        const stream = canvas.captureStream();
        if (stream) {
            resolve(stream);
        } else {
            reject("Failed to create fake video stream");
        }
    });
};

const handleCall = async () => {
  if (callInput.trim() && !isCallActive) {
    connectedUser.current = callInput.trim();

    // Ensure local tracks are added before creating an offer
    if (!stream.current) {
      stream.current = await getMediaStream();
      stream.current.getTracks().forEach((track) =>
        yourConn.current.addTrack(track, stream.current)
      );
    }

    const offer = await yourConn.current.createOffer();
    await yourConn.current.setLocalDescription(offer);
    send({ type: "offer", offer });
  }
};

  
  const handleOffer = async (offer, name) => {
    try {
      

      if (isCallActive) {
        setPendingCaller({ offer, name });
        alert(`${name} is calling you. Finish your current call or accept the new call.`);
        return;
      }
      await yourConn.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await yourConn.current.createAnswer();
      await yourConn.current.setLocalDescription(answer);
      send({ type: "answer", answer }); // Send answer back to the offerer
    } catch (error) {
      console.error("Error handling offer:", error);
    }
    // Save the offer and caller information for later acceptance
    setPendingCaller({ offer, name });
    connectedUser.current = name; // Set the connected user's name
    callerName.current = name; // Track the caller for UI 
    setIsIncoming(true); // Indicate that there's an incoming call

  };

  const handleAnswer = async (answer) => {
    try {
      await yourConn.current.setRemoteDescription(new RTCSessionDescription(answer));
      setIsCallActive(true);
    } catch (err) {
      console.error("Error setting remote description:", err);
    }
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
        .setRemoteDescription(new RTCSessionDescription(pendingCaller.offer))
        .then(() => {
          return yourConn.current.createAnswer();
        })
        .then((answer) => {
          yourConn.current.setLocalDescription(answer);
          send({ type: "answer", answer: answer });
          setIsCallActive(true);
          setPendingCaller(null);
          setIsIncoming(false);
        })
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
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
  
      // Replace the video track in the peer connection
      const sender = yourConn.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
  
      if (sender) {
        // Replace the existing video track with the screen-sharing track
        await sender.replaceTrack(screenTrack);
      } else {
        // If no video sender is found, add the screen-sharing track
        yourConn.current.addTrack(screenTrack, screenStream);
      }
  
      // Update the local video to display the shared screen
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
  
      // Stop screen sharing when the user stops sharing
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };
  
  const stopScreenShare = () => {
    // Reset the original video stream
    const videoTrack = stream.current.getVideoTracks()[0];
    const sender = yourConn.current
      .getSenders()
      .find((s) => s.track && s.track.kind === "video");
  
    if (sender && videoTrack) {
      sender.replaceTrack(videoTrack);
    }
  
    // Update the local video element to display the original stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream.current;
    }
  };
  

  const startTranscription = () => {
    if (!browserSupportsSpeechRecognition) {
      return alert("Your browser does not support speech recognition.");
    }

    // Start listening with continuous mode
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: false,
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
          <img src="/vite.svg"></img>
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
            <video ref={localVideoRef} autoPlay width={280} poster={stream.current ? "" : "/vite.svg"} />
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

