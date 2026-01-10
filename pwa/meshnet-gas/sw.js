// GAS-compatible Service Worker - no classes, only functions
const CACHE_NAME = 'meshnet-gas-v1';

// Install event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html'
      ]);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate event
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Fetch handler
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

// Global variables (GAS style - no classes)
var peerConnections = {};
var dataChannels = {};
var currentPeerId = null;
var gasEndpoint = null;

// Message handler from clients
self.addEventListener('message', function(event) {
  var data = event.data;
  var source = event.source;

  switch (data.type) {
    case 'INIT_GAS':
      gasEndpoint = data.endpoint;
      currentPeerId = data.peerId;
      initGASConnection();
      break;

    case 'CONNECT_TO_PEER':
      connectToPeer(data.targetPeerId);
      break;

    case 'SEND_DATA':
      sendDataToPeer(data.peerId, data.payload);
      break;

    case 'GET_PEERS':
      getPeersFromGAS(source);
      break;
    default:
      break;
  }
});

// Initialize connection to GAS backend
function initGASConnection() {
  if (!currentPeerId || !gasEndpoint) {
    return;
  }

  // Register with GAS
  fetchGAS('register', {
    peerId: currentPeerId,
    action: 'register'
  }).then(function() {
    broadcastToClients({
      type: 'GAS_CONNECTED',
      peerId: currentPeerId
    });

    // Start polling for messages
    pollGASMessages();
  }).catch(function(error) {
    console.error('GAS registration failed:', error);
  });
}

// Poll GAS for incoming messages
function pollGASMessages() {
  if (!currentPeerId || !gasEndpoint) {
    return;
  }

  fetchGAS('poll', {
    peerId: currentPeerId,
    action: 'poll'
  }).then(function(response) {
    if (response && response.messages) {
      processGASMessages(response.messages);
    }

    // Poll again after delay
    setTimeout(pollGASMessages, 2000);
  }).catch(function(error) {
    console.error('GAS poll failed:', error);
    setTimeout(pollGASMessages, 5000);
  });
}

// Process messages from GAS
function processGASMessages(messages) {
  messages.forEach(function(message) {
    switch (message.type) {
      case 'peer_offer':
        handlePeerOffer(message.from, message.data);
        break;

      case 'peer_answer':
        handlePeerAnswer(message.from, message.data);
        break;

      case 'ice_candidate':
        handleIceCandidate(message.from, message.data);
        break;

      case 'peer_list':
        broadcastToClients({
          type: 'PEER_LIST',
          peers: message.data
        });
        break;

      case 'direct_message':
        broadcastToClients({
          type: 'MESSAGE_RECEIVED',
          from: message.from,
          message: message.data
        });
        break;
      default:
        break;
    }
  });
}

// WebRTC functions (GAS-compatible style)
function connectToPeer(targetPeerId) {
  if (peerConnections[targetPeerId]) {
    return;
  }

  var pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });

  peerConnections[targetPeerId] = pc;

  // Create data channel
  var dc = pc.createDataChannel('mesh', {
    ordered: false,
    maxRetransmits: 0
  });

  setupDataChannel(dc, targetPeerId);

  // Create offer
  pc.createOffer().then(function(offer) {
    return pc.setLocalDescription(offer);
  }).then(function() {
    // Send offer via GAS
    return fetchGAS('send', {
      peerId: currentPeerId,
      action: 'send',
      to: targetPeerId,
      type: 'peer_offer',
      data: pc.localDescription
    });
  }).catch(function(error) {
    console.error('Offer creation failed:', error);
  });

  // ICE candidates
  pc.onicecandidate = function(event) {
    if (event.candidate) {
      fetchGAS('send', {
        peerId: currentPeerId,
        action: 'send',
        to: targetPeerId,
        type: 'ice_candidate',
        data: event.candidate
      });
    }
  };
}

function handlePeerOffer(from, offer) {
  var pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });

  peerConnections[from] = pc;

  pc.ondatachannel = function(event) {
    setupDataChannel(event.channel, from);
  };

  pc.setRemoteDescription(new RTCSessionDescription(offer))
    .then(function() {
      return pc.createAnswer();
    })
    .then(function(answer) {
      return pc.setLocalDescription(answer);
    })
    .then(function() {
      return fetchGAS('send', {
        peerId: currentPeerId,
        action: 'send',
        to: from,
        type: 'peer_answer',
        data: pc.localDescription
      });
    })
    .catch(function(error) {
      console.error('Answer handling failed:', error);
    });

  pc.onicecandidate = function(event) {
    if (event.candidate) {
      fetchGAS('send', {
        peerId: currentPeerId,
        action: 'send',
        to: from,
        type: 'ice_candidate',
        data: event.candidate
      });
    }
  };
}

function handlePeerAnswer(from, answer) {
  var pc = peerConnections[from];
  if (pc) {
    pc.setRemoteDescription(new RTCSessionDescription(answer))
      .catch(function(error) {
        console.error('Set remote description failed:', error);
      });
  }
}

function handleIceCandidate(from, candidate) {
  var pc = peerConnections[from];
  if (pc && candidate) {
    pc.addIceCandidate(new RTCIceCandidate(candidate))
      .catch(function(error) {
        console.error('Add ICE candidate failed:', error);
      });
  }
}

function setupDataChannel(channel, peerId) {
  dataChannels[peerId] = channel;

  channel.onopen = function() {
    broadcastToClients({
      type: 'PEER_CONNECTED',
      peerId: peerId
    });
  };

  channel.onmessage = function(event) {
    broadcastToClients({
      type: 'PEER_MESSAGE',
      from: peerId,
      data: JSON.parse(event.data)
    });
  };

  channel.onclose = function() {
    delete dataChannels[peerId];
    delete peerConnections[peerId];
    broadcastToClients({
      type: 'PEER_DISCONNECTED',
      peerId: peerId
    });
  };
}

function sendDataToPeer(peerId, payload) {
  var channel = dataChannels[peerId];
  if (channel && channel.readyState === 'open') {
    channel.send(JSON.stringify(payload));
    return true;
  }
  return false;
}

// GAS API communication
function fetchGAS(endpoint, data) {
  if (!gasEndpoint) {
    return Promise.reject('No GAS endpoint');
  }

  var url = gasEndpoint + '?endpoint=' + endpoint;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(function(response) {
    return response.json();
  });
}

function getPeersFromGAS(source) {
  fetchGAS('peers', {
    peerId: currentPeerId,
    action: 'getPeers'
  }).then(function(response) {
    if (source && response && response.peers) {
      source.postMessage({
        type: 'PEER_LIST',
        peers: response.peers
      });
    }
  });
}

// Broadcast to all clients
function broadcastToClients(message) {
  self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage(message);
    });
  });
}
