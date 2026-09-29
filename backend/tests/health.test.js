const request = require('supertest');
const app = require('../src/app');
const { closeDatabase } = require('./setup');

describe('Health API', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('should return 200 and healthy status when database is reachable', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('database', 'connected');
    expect(res.body).toHaveProperty('timestamp');
  });
});
