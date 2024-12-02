# Snapmeet - A Cutting-Edge Communication Platform

Snapmeet is an advanced platform designed for seamless and efficient communication. With a range of powerful features, it leverages modern technologies to provide an outstanding user experience.

## Key Features

- **Video Calling**: High-quality, real-time video communication.
- **Chat**: Instant messaging for quick and easy communication.
- **Live Chat Translation**: Automatically translate messages into local languages for smooth communication across borders.
- **Live Video Translation**: Translate spoken content in real-time for video calls.
- **Screen Sharing**: Share your screen with others during meetings or discussions.
- **Emoji Support**: Express yourself with fun emojis.
- **Document Sharing**: Easily share documents in real time.
- **Speech Recognition**: Convert speech into text for accurate and efficient communication.
- **Images** - ![Untitled video - Made with Clipchamp (1)-0](https://github.com/user-attachments/assets/c06ea9d1-4da1-4a79-90ed-55468c8355c0)
![Untitled video - Made with Clipchamp (1)-4](https://github.com/user-attachments/assets/6f26fa38-ee8d-4eee-8460-8290f39c1e71)
![Untitled video - Made with Clipchamp (1)-3](https://github.com/user-attachments/assets/aa2ce843-5e4d-4417-a56d-f17cb89e0b02)
![Untitled video - Made with Clipchamp (1)-2](https://github.com/user-attachments/assets/09c0ee93-ba8d-4441-bdd3-7f3a002d9e35)
![Untitled video - Made with Clipchamp (1)-1](https://github.com/user-attachments/assets/79d9805b-937c-453b-942d-0ea5bdaa5b7a)


## Future Enhancements

- **Sign Language Recognition**: Support for recognizing and interpreting sign language to make communication more inclusive.
- **Speaker Assistance for Visually Impaired Users**: Features designed to assist visually impaired users during calls.
- **Voice Command Functionalities**: Allow users to control the platform using voice commands for hands-free interactions.

### Snapmeet is an advanced communication platform designed to solve various communication challenges by providing a unified experience for real-time interaction. It stands out with its unique combination of features, focusing on inclusivity, language barriers, and seamless collaboration.

## Test Video - 


https://github.com/user-attachments/assets/5a347323-0ccd-4707-8996-d465996de856



## Problems It Solves

  1. **Language Barriers**
     In a globalized world, communication across different languages can be a significant challenge. Snapmeet offers **live chat and video translation** in local languages, enabling users to communicate seamlessly despite language differences.
  
  2. **Inaccessible Communication for Visually Impaired Users**
     Many communication platforms are not optimized for users with disabilities. Snapmeet addresses this by planning to implement **speaker assistance** for visually impaired users, making the platform more inclusive.
  
  3. **Sign Language Communication**
     For users who rely on sign language, many platforms do not offer support. Snapmeet aims to incorporate **sign language recognition** to enable communication for individuals who use sign language as their primary mode of communication.
  
  4. **Real-Time Collaboration Challenges**
     Remote work and virtual collaboration require a range of tools for effective communication. Snapmeet solves this with features like **screen sharing**, **document sharing**, and **video/audio calling** in a single platform, all integrated with **real-time text and speech translation**.
  
  5. **Complexity of Multiple Tools**
     Many platforms require using separate tools for video calling, chat, and document sharing, creating a fragmented experience. Snapmeet provides a **unified communication experience**, where users can easily switch between features without leaving the platform.
  
  6. **Inaccurate Speech Recognition**
     Existing speech recognition tools often struggle with accents or noisy environments. Snapmeet leverages advanced **speech recognition APIs**, ensuring a more accurate transcription for real-time communication.

## Uniqueness

  1. **Integrated Real-Time Language Translation**
     Unlike most communication platforms that offer translation only for text or in limited scenarios, Snapmeet integrates both **text and speech translation** in real-time for both chats and video calls, making it adaptable for global users.
  
  2. **Speech and Text Recognition for Hands-Free Interaction**
     The platform's **speech recognition** feature is not limited to converting speech to text but is also designed to enhance interaction by allowing hands-free communication, which is ideal for multitasking or accessibility needs.
  
  3. **Innovative Inclusion Features**
     Snapmeet is focused on inclusivity with features like **sign language recognition** and **speaker assistance for visually impaired users**, which aren't commonly available in mainstream platforms.
  
  4. **Unified Platform for Communication**
     Snapmeet combines all key communication features—video calling, chat, screen sharing, document sharing, and translation—into a single platform, providing users with a **seamless, integrated experience**.

## Core Technologies Used

- **MERN Stack**: MongoDB, Express, React, and Node.js to power the backend and frontend.
- **WebRTC**: Real-time peer-to-peer connections for video and audio communication.
- **WebSocket (WS)**: For seamless real-time communication.
- **Speech Recognition APIs**: To convert spoken words into text.
- **Text and Speech Translation APIs**: For automatic translation of text and speech to different languages.

## Getting Started

Follow the instructions below to set up and start using Snapmeet:

### Prerequisites

Make sure you have the following installed on your system:

- **Node.js**
- **pnpm**

### Installation and Setup

1. **Clone or Download the Repository**  
   Clone the repository or download the source code and navigate to the project folder:

   ```bash
   git clone https://github.com/DipSingh05/snapmeet.git
   cd snapmeet
   
2. **Enable Insecure Localhost (Chrome flags)**

  - Open Chrome and navigate to `chrome://flags/`.  
  - Search for **"Picture given"** and enable the flag.  
  - This is necessary to enable WebRTC connections on `localhost`.
  - For ip open cmd and search **"ipconfig"** and you will get **ip (192.168.x.x)**.
  - ![image](https://github.com/user-attachments/assets/f52f4dbd-ecbc-4471-8266-8c1ed20e3f94)


3. **Install Dependencies**
    Run the following command to install the necessary packages:  
    ```bash
    pnpm install
    
4. **Build and run**
    Run the following command to install the necessary packages:  
    ```bash
    pnpm run build
    pnpm run dev

### Test the Setup
  - Connect your phone to the same network as your laptop.
  - open two tabs in incognito mode in your browser.
  - Access Snapmeet at 192.168.x.x:5137 (use your local IP from ipconfig for this)

### Contributions
  Contributions are welcome!
  Feel free to submit issues or pull requests to improve Snapmeet.

### Lincense
  - MIT License
