// DOM elements
const chatBubble = document.getElementById('chatBubble');
const chatWidget = document.getElementById('chatWidget');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

let isOpen = false;
let faqData = [];

// Fetch FAQ data from backend
fetch("/get_faq")
  .then(res => res.json())
  .then(data => {
    faqData = data;
  })
  .catch(err => {
    console.error("Failed to load FAQ data:", err);
  });

// Simple similarity function
function similarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// Find best answer
function findBestAnswer(userQuery) {
  let bestScore = 0;
  let bestAnswer = "I'm not sure about that one 😕 Try asking something else about Nachiketa!";
  const queryLower = userQuery.toLowerCase();

  for (const faq of faqData) {
    for (const question of faq.questions) {
      const score = similarity(queryLower, question.toLowerCase());
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestAnswer = faq.answer;
      }
    }
  }

  return bestAnswer;
}

// Toggle chat widget
function toggleChat() {
  isOpen = !isOpen;
  chatBubble.classList.toggle('open', isOpen);
  chatWidget.classList.toggle('open', isOpen);
  if (isOpen) chatInput.focus();
}

// Add message to chat
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;

  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTyping() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot';
  typingDiv.id = 'typing-indicator';

  const typingContent = document.createElement('div');
  typingContent.className = 'typing-indicator';
  typingContent.innerHTML = `
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  typingDiv.appendChild(typingContent);
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function hideTyping() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) typingIndicator.remove();
}

// Send message
function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, true);
  chatInput.value = '';
  showTyping();

  setTimeout(() => {
    hideTyping();
    const response = findBestAnswer(message);
    addMessage(response);
  }, 800 + Math.random() * 800);
}

// Ask suggested question
function askQuestion(question) {
  chatInput.value = question;
  sendMessage();
}

// Event listeners
chatBubble.addEventListener('click', toggleChat);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
document.addEventListener('click', (e) => {
  if (isOpen && !chatWidget.contains(e.target) && !chatBubble.contains(e.target)) {
    toggleChat();
  }
});
chatWidget.addEventListener('click', (e) => e.stopPropagation());
