const request = require('supertest');
const app = require('../src/app');
const { clearDatabase, closeDatabase } = require('./setup');

describe('Tasks API', () => {
  let user1Token;
  let user1Id;
  let user2Token;

  beforeEach(async () => {
    await clearDatabase();

    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'Password123!',
      });
    user1Token = res1.body.token;
    user1Id = res1.body.user.id;

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'Password123!',
      });
    user2Token = res2.body.token;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Task CRUD and Ownership', () => {
    it('should create a task successfully for authenticated user', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'My First Task',
          description: 'Task details here',
          status: 'pending',
          priority: 'high',
          due_date: '2026-10-15T12:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('task');
      expect(res.body.task.title).toBe('My First Task');
      expect(res.body.task.user_id).toBe(user1Id);
      expect(res.body.task.status).toBe('pending');
      expect(res.body.task.priority).toBe('high');
    });

    it('should reject task creation with missing title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          description: 'No title given',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject invalid status or priority', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Invalid Task',
          status: 'invalid_status',
          priority: 'extreme',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should retrieve task by ID for the owner', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Task for User 1',
          status: 'pending',
        });
      const taskId = createRes.body.task.id;

      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.task.id).toBe(taskId);
      expect(getRes.body.task.title).toBe('Task for User 1');
    });

    it('PREVENT cross-user access: User 2 cannot GET User 1 task (returns 403)', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Secret Task User 1',
        });
      const taskId = createRes.body.task.id;

      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body).toHaveProperty('error');
    });

    it('PREVENT cross-user access: User 2 cannot UPDATE User 1 task (returns 403)', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Task User 1',
        });
      const taskId = createRes.body.task.id;

      const putRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked Title',
        });

      expect(putRes.status).toBe(403);
      expect(putRes.body).toHaveProperty('error');
    });

    it('PREVENT cross-user access: User 2 cannot DELETE User 1 task (returns 403)', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Task User 1',
        });
      const taskId = createRes.body.task.id;

      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body).toHaveProperty('error');
    });

    it('should update task successfully by owner', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Original Title',
          status: 'pending',
          priority: 'low',
        });
      const taskId = createRes.body.task.id;

      const updateRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Updated Title',
          status: 'completed',
          priority: 'high',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.task.title).toBe('Updated Title');
      expect(updateRes.body.task.status).toBe('completed');
      expect(updateRes.body.task.priority).toBe('high');
    });

    it('should delete task successfully by owner', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'To Be Deleted',
        });
      const taskId = createRes.body.task.id;

      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(deleteRes.status).toBe(200);

      // Verify it is gone
      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(getRes.status).toBe(404);
    });
  });

  describe('Search, Filter, Sort and Pagination', () => {
    beforeEach(async () => {
      // Seed tasks for User 1
      const tasksToCreate = [
        { title: 'Alpha task testing', description: 'Testing the alpha release', status: 'pending', priority: 'high', due_date: '2026-10-01T00:00:00.000Z' },
        { title: 'Beta deployment', description: 'Deploying the beta platform', status: 'in_progress', priority: 'medium', due_date: '2026-10-05T00:00:00.000Z' },
        { title: 'Gamma documentation', description: 'Write alpha guides', status: 'completed', priority: 'low', due_date: '2026-10-10T00:00:00.000Z' },
        { title: 'Delta bug fix', description: 'Fixing critical issues', status: 'pending', priority: 'high', due_date: '2026-10-12T00:00:00.000Z' },
        { title: 'Epsilon security audit', description: 'Security review for backend', status: 'completed', priority: 'high', due_date: '2026-10-20T00:00:00.000Z' },
      ];

      for (const t of tasksToCreate) {
        await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(t);
      }

      // Also create a task for User 2 that should NEVER be visible to User 1
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'User 2 Private Task',
          description: 'Alpha keyword in User 2 task',
        });
    });

    it('should search tasks by title and description case-insensitively', async () => {
      const res = await request(app)
        .get('/api/tasks?search=alpha')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      // 'Alpha task testing' (title match) and 'Gamma documentation' (description match: 'Write alpha guides')
      expect(res.body.tasks.length).toBe(2);
      expect(res.body.total).toBe(2);
      // Ensure User 2's task is NOT returned
      const titles = res.body.tasks.map((t) => t.title);
      expect(titles).not.toContain('User 2 Private Task');
    });

    it('should filter tasks by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=completed')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(2);
      res.body.tasks.forEach((t) => {
        expect(t.status).toBe('completed');
      });
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(3);
      res.body.tasks.forEach((t) => {
        expect(t.priority).toBe('high');
      });
    });

    it('should sort tasks according to allowlisted field and order', async () => {
      const res = await request(app)
        .get('/api/tasks?sortBy=title&order=ASC')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks[0].title).toBe('Alpha task testing');
    });

    it('should paginate results with page, limit, and totalPages', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(2);
      expect(res.body.total).toBe(5);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(2);
      expect(res.body.totalPages).toBe(3);

      const resPage2 = await request(app)
        .get('/api/tasks?page=2&limit=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.tasks.length).toBe(2);
      expect(resPage2.body.page).toBe(2);
    });
  });
});
