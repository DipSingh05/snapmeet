
import translate from "translate-google-api";

const handleWebSocketConnection = (connection, users) => {

  connection.on("message", async (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error("Invalid JSON:", e);
      return;
    }

    switch (data.type) {
      case "login":
        if (users[data.name]) {
          sendTo(connection, { type: "login", success: false });
        } else {
          users[data.name] = { connection, language: data.language };
          connection.name = data.name;
          sendTo(connection, { type: "login", success: true });
        }
        break;

      case "offer":
        if (users[data.name]) {
          sendTo(users[data.name].connection, {
            type: "offer",
            offer: data.offer,
            name: connection.name,
          });
        }
        break;

      case "answer":
        if (users[data.name]) {
          sendTo(users[data.name].connection, {
            type: "answer",
            answer: data.answer,
          });
        }
        break;

      case "candidate":
        if (users[data.name]) {
          sendTo(users[data.name].connection, {
            type: "candidate",
            candidate: data.candidate,
          });
        }
        break;

      case "message":
        if (users[data.name]) {
          try {
            // Await the translation result
            const translatedMessage = await translateText(data.message, users[data.name].language);
            sendTo(users[data.name].connection, {
              type: "message",
              message: data.message,
              transmsg: translatedMessage,
            });
          } catch (error) {
            console.error("Error in message translation:", error);
            sendTo(users[data.name].connection, {
              type: "message",
              message: data.message,
              transmsg: data.message, // Send original message if translation fails
            });
          }
        }
        break;

        case "transcript":
        if (users[data.name]) {
          
          try {
            // Await the translation result
            const translatedMessage = await translateText(data.message, users[data.name].language);
            sendTo(users[data.name].connection, {
              type: "transcript",
              message: data.message,
              transmsg: translatedMessage,
            });
          } catch (error) {
            console.error("Error in message translation:", error);
            sendTo(users[data.name].connection, {
              type: "transcript",
              message: data.message,
              transmsg: data.message, // Send original message if translation fails
            });
          }
        }
        break;


      case "file":
        if (users[data.name]) {
          sendTo(users[data.name].connection, {
            type: "file",
            file: data.file,
            fileName: data.fileName,
          });
        }
        break;

      case "leave":
        if (users[data.name]) {
          sendTo(users[data.name].connection, { type: "leave" });
        }
        break;

      default:
        break;
    }
  });

  //when user exits, for example closes a browser window 
  //this may help if we are still in "offer","answer" or "candidate" state 

  connection.on("close", () => {
    if (connection.name) {
      delete users[connection.name];
      if (connection.otherName) {
        const otherConn = users[connection.otherName];
        if (otherConn) {
          sendTo(otherConn, { type: "leave" });
        }
      }
    }
  });

};

function sendTo(connection, message) {
  connection.send(JSON.stringify(message));
}

const translateText = async (text, targetLanguage) => {
  try {
    const translated = await translate(`${text}`, { to: targetLanguage });
 
    return translated;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return the original text if translation fails
  }
};


export { handleWebSocketConnection };