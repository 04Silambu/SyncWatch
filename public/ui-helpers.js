// ========== UI HELPER FUNCTIONS FOR PHASE 12 ==========
// Add these functions to handle new UI elements

// Update role badge in header
function updateRoleBadge(role) {
    const badge = document.getElementById('role-badge');
    if (badge) {
        badge.style.display = 'inline-flex';
        badge.className = `pill-badge ${role}`;
        badge.textContent = role === 'host' ? '🟢 Host' : '🔵 Viewer';
    }
}

// Update room ID badge in header
function updateRoomBadge(roomId) {
    const badge = document.getElementById('room-badge');
    if (badge) {
        badge.style.display = 'inline-flex';
        badge.textContent = `Room: ${roomId}`;
    }
}

// Show live indicator
function showLiveIndicator() {
    const indicator = document.getElementById('live-indicator');
    if (indicator) {
        indicator.style.display = 'inline-flex';
    }
}

// Toggle UI sections when room state changes
function updateUIForRoomState(hasRoom) {
    const preRoom = document.getElementById('pre-room-controls');
    const postRoom = document.getElementById('post-room-controls');

    if (hasRoom) {
        if (preRoom) preRoom.style.display = 'none';
        if (postRoom) postRoom.style.display = 'block';
    } else {
        if (preRoom) preRoom.style.display = 'block';
        if (postRoom) postRoom.style.display = 'none';
    }
}

// Render chat message with new bubble design
function renderChatMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${data.role}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `message-bubble ${data.role}`;

    // Just the message text - clean and simple
    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = data.message;

    // Small timestamp at bottom right
    const time = document.createElement('div');
    time.className = 'timestamp';
    time.textContent = data.time;

    bubbleDiv.appendChild(text);
    bubbleDiv.appendChild(time);
    messageDiv.appendChild(bubbleDiv);

    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Render recommendations as cards
function renderRecommendationCards(movies) {
    const list = document.getElementById('recommendation-list');
    if (!list) return;

    list.innerHTML = '';

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.textContent = movie;
        list.appendChild(card);
    });
}

// Show viewer overlay on video
function showViewerOverlay() {
    const overlay = document.getElementById('viewer-overlay');
    if (overlay) {
        overlay.style.display = 'block';
    }
}

// Hide viewer overlay
function hideViewerOverlay() {
    const overlay = document.getElementById('viewer-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Make functions globally available
window.updateRoleBadge = updateRoleBadge;
window.updateRoomBadge = updateRoomBadge;
window.showLiveIndicator = showLiveIndicator;
window.updateUIForRoomState = updateUIForRoomState;
window.renderChatMessage = renderChatMessage;
window.renderRecommendationCards = renderRecommendationCards;
window.showViewerOverlay = showViewerOverlay;
window.hideViewerOverlay = hideViewerOverlay;
