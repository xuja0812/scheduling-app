const request = require('supertest');
const app = require('../index'); 
require('dotenv').config();

describe('Basic API tests', () => {
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health'); 
    expect(res.statusCode).toBe(200);
  });

  test('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});
