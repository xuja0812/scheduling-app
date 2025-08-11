const Redis = require('ioredis');

test('Redis pub/sub works', async () => {
  const pub = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1' });
  const sub = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1' });
  
  const received = new Promise(resolve => {
    sub.subscribe('test');
    sub.on('message', (channel, message) => resolve(message));
  });
  
  pub.publish('test', 'hello');
  expect(await received).toBe('hello');
});