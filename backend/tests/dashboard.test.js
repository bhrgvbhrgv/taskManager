const request = require('supertest');
const app = require('../src/app');
const { clearDatabase, closeDatabase } = require('./setup');

describe('Dashboard Statistics API', () => {
  let userToken;
  let otherUserToken;

  beforeEach(async () => {
    await clearDatabase();

    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dashboard User',
        email: 'dash@example.com',
        password: 'Password123!',
      });
    userToken = userRes.body.token;

    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123!',
      });
    otherUserToken = otherRes.body.token;

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // User tasks:
    // 1: pending, high, overdue
    // 2: in_progress, medium, future
    // 3: completed, low, overdue (completed tasks are NOT counted as overdue)
    // 4: pending, medium, future
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({
      title: 'T1', status: 'pending', priority: 'high', due_date: pastDate,
    });
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({
      title: 'T2', status: 'in_progress', priority: 'medium', due_date: futureDate,
    });
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({
      title: 'T3', status: 'completed', priority: 'low', due_date: pastDate,
    });
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({
      title: 'T4', status: 'pending', priority: 'medium', due_date: futureDate,
    });

    // Other user tasks (should NOT affect user's stats):
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${otherUserToken}`).send({
      title: 'Other Task', status: 'pending', priority: 'high', due_date: pastDate,
    });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should return aggregated stats strictly for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 4,
      pending: 2,
      in_progress: 1,
      completed: 1,
      overdue: 1, // Only T1 is pending and past due; T3 is completed so not overdue
      priority: {
        low: 1,
        medium: 2,
        high: 1,
      },
    });
  });

  it('should require authentication for dashboard stats', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
  });
});
