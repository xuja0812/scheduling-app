const WebSocket = require('ws');

const TARGET_CONNECTIONS = 100;
const connections = [];
let connectedCount = 0;
let messagesReceived = 0;

console.log(`Starting load test with ${TARGET_CONNECTIONS} connections...`);

// Create connections
for (let i = 0; i < TARGET_CONNECTIONS; i++) {
  setTimeout(() => {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.on('open', () => {
      connectedCount++;
      console.log(`Connected ${connectedCount}/${TARGET_CONNECTIONS}`);
      
      // Join a room
      ws.send(JSON.stringify({
        type: 'join-student-room',
        data: { 
          studentId: `room-${i % 10}`,
          userId: `user-${i}`, 
          userType: 'student' 
        }
      }));
      
      // Send periodic messages
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'chat-message',
            message: `Load test message from user-${i}`,
            sender: `user-${i}`,
            timestamp: Date.now()
          }));
        } else {
          clearInterval(interval);
        }
      }, 2000 + Math.random() * 3000); 
    });
    
    ws.on('message', (data) => {
      messagesReceived++;
    });
    
    ws.on('error', (error) => {
      console.error(`Connection ${i} error:`, error.message);
    });
    
    ws.on('close', () => {
      console.log(`Connection ${i} closed`);
    });
    
    connections.push(ws);
  }, i * 50); 
}

setInterval(() => {
  const openConnections = connections.filter(ws => ws.readyState === WebSocket.OPEN).length;
  console.log(`Stats: ${openConnections} open connections, ${messagesReceived} messages received`);
}, 5000);

setTimeout(() => {
  console.log('Stopping load test...');
  connections.forEach(ws => ws.close());
  process.exit(0);
}, 60000);