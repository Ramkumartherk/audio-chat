document.addEventListener('DOMContentLoaded', () => {
  const socket = io('/');
  const audioGrid = document.getElementById('audio-grid');
  const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001',
  });
  const myAudio = document.createElement('audio');
  myAudio.muted = true; // This line mutes your own audio, make sure it's intended

  // Dictionary to store connected peers
  const peers = {};

  // Get user's audio stream
  navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true,
  }).then((stream) => {
    addAudioStream(myAudio, stream);

    // Answer incoming calls and add them to the grid
    myPeer.on('call', (call) => {
      call.answer(stream);
      const audio = document.createElement('audio');
      call.on('stream', (userAudioStream) => {
        addAudioStream(audio, userAudioStream);
      });
    });

    // When a new user connects, call them and add to the grid
    socket.on('user-connected', (userId) => {
      connectToNewUser(userId, stream);
    });
  });

  // Handle user disconnection
  socket.on('user-disconnected', (userId) => {
    if (peers[userId]) {
      peers[userId].close();
      delete peers[userId];
    }
  });

  // Open a connection to the server
  myPeer.on('open', (id) => {
    socket.emit('join-room', ROOM_ID, id);
  });

  // Call a new user and add them to the grid
  function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const audio = document.createElement('audio');
    call.on('stream', (userAudioStream) => {
      addAudioStream(audio, userAudioStream);
    });
    call.on('close', () => {
      audio.remove();
    });

    peers[userId] = call;
  }

  // Add audio stream to the grid
  function addAudioStream(audio, stream) {
    audio.srcObject = stream;
    audio.addEventListener('loadedmetadata', () => {
      audio.play();
    });
    audioGrid.appendChild(audio);
  }
});
