// Google Apps Script Backend for P2P Mesh Network
// Deploy as Web App: Execute as "Me", Access: "Anyone"

var CACHE = CacheService.getScriptCache();
var PROPERTIES = PropertiesService.getScriptProperties();

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'MeshNet GAS Backend'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  if (e.parameter.endpoint === 'options') {
    return handleCORS();
  }

  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return createErrorResponse('Invalid JSON');
  }

  var endpoint = e.parameter.endpoint;
  var response;

  switch (endpoint) {
    case 'register':
      response = handleRegister(data);
      break;
    case 'poll':
      response = handlePoll(data);
      break;
    case 'send':
      response = handleSend(data);
      break;
    case 'peers':
      response = handleGetPeers(data);
      break;
    default:
      response = { error: 'Invalid endpoint' };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleCORS() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

function handleRegister(data) {
  var peerId = data.peerId;
  if (!peerId) {
    return { error: 'Missing peerId' };
  }

  var peerData = {
    id: peerId,
    lastSeen: Date.now(),
    ip: null
  };

  PROPERTIES.setProperty('peer_' + peerId, JSON.stringify(peerData));
  updatePeerList(peerId);

  CACHE.put('messages_' + peerId, JSON.stringify([]), 300);

  return { success: true, peerId: peerId };
}

function handlePoll(data) {
  var peerId = data.peerId;
  if (!peerId) {
    return { error: 'Missing peerId' };
  }

  var peerData = JSON.parse(PROPERTIES.getProperty('peer_' + peerId) || '{}');
  peerData.lastSeen = Date.now();
  PROPERTIES.setProperty('peer_' + peerId, JSON.stringify(peerData));

  var messagesKey = 'messages_' + peerId;
  var messagesJson = CACHE.get(messagesKey);
  var messages = messagesJson ? JSON.parse(messagesJson) : [];

  CACHE.put(messagesKey, JSON.stringify([]), 300);

  cleanupOldPeers();

  return {
    success: true,
    messages: messages,
    timestamp: Date.now()
  };
}

function handleSend(data) {
  var from = data.peerId;
  var to = data.to;
  var type = data.type;
  var messageData = data.data;

  if (!from || !type) {
    return { error: 'Missing parameters' };
  }

  var senderData = JSON.parse(PROPERTIES.getProperty('peer_' + from) || '{}');
  senderData.lastSeen = Date.now();
  PROPERTIES.setProperty('peer_' + from, JSON.stringify(senderData));

  var message = {
    from: from,
    type: type,
    data: messageData,
    timestamp: Date.now()
  };

  if (to === 'broadcast') {
    var allPeers = JSON.parse(PROPERTIES.getProperty('peer_list') || '[]');

    allPeers.forEach(function(peerId) {
      if (peerId !== from) {
        addMessageToQueue(peerId, message);
      }
    });
  } else {
    addMessageToQueue(to, message);
  }

  return { success: true };
}

function handleGetPeers(data) {
  var peerId = data.peerId;

  if (peerId) {
    var peerData = JSON.parse(PROPERTIES.getProperty('peer_' + peerId) || '{}');
    peerData.lastSeen = Date.now();
    PROPERTIES.setProperty('peer_' + peerId, JSON.stringify(peerData));
  }

  var peerList = JSON.parse(PROPERTIES.getProperty('peer_list') || '[]');

  var activePeers = peerList.filter(function(existingPeerId) {
    var peerData = JSON.parse(PROPERTIES.getProperty('peer_' + existingPeerId) || '{}');
    if (!peerData.lastSeen) {
      return false;
    }
    return (Date.now() - peerData.lastSeen) < 5 * 60 * 1000;
  });

  PROPERTIES.setProperty('peer_list', JSON.stringify(activePeers));

  return {
    success: true,
    peers: activePeers,
    count: activePeers.length
  };
}

function updatePeerList(peerId) {
  var peerList = JSON.parse(PROPERTIES.getProperty('peer_list') || '[]');

  if (!peerList.includes(peerId)) {
    peerList.push(peerId);
    PROPERTIES.setProperty('peer_list', JSON.stringify(peerList));
  }
}

function addMessageToQueue(peerId, message) {
  var messagesKey = 'messages_' + peerId;
  var messagesJson = CACHE.get(messagesKey);
  var messages = messagesJson ? JSON.parse(messagesJson) : [];

  messages.push(message);

  if (messages.length > 50) {
    messages = messages.slice(-50);
  }

  CACHE.put(messagesKey, JSON.stringify(messages), 300);
}

function cleanupOldPeers() {
  var peerList = JSON.parse(PROPERTIES.getProperty('peer_list') || '[]');
  var now = Date.now();

  var activePeers = peerList.filter(function(existingPeerId) {
    var peerData = JSON.parse(PROPERTIES.getProperty('peer_' + existingPeerId) || '{}');
    if (!peerData.lastSeen) {
      return false;
    }

    if ((now - peerData.lastSeen) > 10 * 60 * 1000) {
      PROPERTIES.deleteProperty('peer_' + existingPeerId);
      CACHE.remove('messages_' + existingPeerId);
      return false;
    }
    return true;
  });

  PROPERTIES.setProperty('peer_list', JSON.stringify(activePeers));
}

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    error: message
  })).setMimeType(ContentService.MimeType.JSON);
}
