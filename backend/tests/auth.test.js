const request = require('supertest');
const app = require('../src/app');
const { clearDatabase, closeDatabase } = require('./setup');

describe('Authentication API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Smith',
          email: 'alice@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.name).toBe('Alice Smith');
      expect(res.body.user.email).toBe('alice@example.com');
      expect(res.body.user).not.toHaveProperty('password_hash');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    });

    it('should fail with 409 when registering with an existing email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Smith',
          email: 'alice@example.com',
          password: 'Password123!',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Alice',
          email: 'alice@example.com',
          password: 'Password456!',
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should fail with 400 when validation requirements are not met', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Jones',
          email: 'bob@example.com',
          password: 'Password123!',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('bob@example.com');
      expect(res.body.user).not.toHaveProperty('password_hash');
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with 401 when password is wrong', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it('should fail with 401 when email does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          password: 'Password123!',
        });
      token = res.body.token;
    });

    it('should return current user when valid JWT token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.name).toBe('Charlie Brown');
      expect(res.body.user.email).toBe('charlie@example.com');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should fail with 401 when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail with 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_value');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
