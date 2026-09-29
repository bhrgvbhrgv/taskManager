const bcrypt = require('bcrypt');
const { pool, query } = require('../src/config/db');
const logger = require('../src/utils/logger');
const config = require('../src/config/env');

const seedData = async () => {
  logger.info(`Seeding database: ${config.DB.database}...`);
  try {
    // Clean up existing data
    await query('DELETE FROM tasks');
    await query('DELETE FROM users');

    // Create demo user
    const demoEmail = 'demo@example.com';
    const demoPassword = 'Password123!';
    const demoName = 'Demo User';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(demoPassword, saltRounds);

    const userRes = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [demoName, demoEmail, passwordHash]
    );
    const user = userRes.rows[0];
    logger.info({ user: { id: user.id, email: user.email } }, 'Created demo user');

    // Dates for seed tasks
    const now = new Date();
    const overdueDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const soonDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);    // Tomorrow
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);  // 1 week ahead
    const farFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month ahead

    const tasks = [
      {
        title: 'Review System Architecture Design',
        description: 'Analyze system boundaries, layer separation, and API interfaces for the project.',
        status: 'completed',
        priority: 'high',
        due_date: overdueDate,
      },
      {
        title: 'Configure PostgreSQL Connection Pooling',
        description: 'Verify pool limits, idle client timeouts, and connection retry logic.',
        status: 'completed',
        priority: 'medium',
        due_date: overdueDate,
      },
      {
        title: 'Implement User Authentication Service',
        description: 'Provide secure registration and login using JWT tokens and bcrypt password hashing.',
        status: 'in_progress',
        priority: 'high',
        due_date: soonDate,
      },
      {
        title: 'Implement Task Filtering and Pagination',
        description: 'Build backend query builder supporting status, priority, search text, and pagination.',
        status: 'in_progress',
        priority: 'medium',
        due_date: soonDate,
      },
      {
        title: 'Resolve Overdue Bug Reports',
        description: 'Audit critical bug reports and fix any identified edge-cases.',
        status: 'pending',
        priority: 'high',
        due_date: overdueDate, // Intentional overdue pending task
      },
      {
        title: 'Set up Dashboard Statistics Visuals',
        description: 'Create responsive overview cards and progress bars with pure CSS styling.',
        status: 'pending',
        priority: 'medium',
        due_date: futureDate,
      },
      {
        title: 'Write Unit and Integration Tests',
        description: 'Cover auth, task CRUD, ownership isolation, filtering, and stats with Jest.',
        status: 'pending',
        priority: 'high',
        due_date: futureDate,
      },
      {
        title: 'Update Project Documentation and README',
        description: 'Document architecture, API endpoints, setup guide, and demo credentials.',
        status: 'pending',
        priority: 'low',
        due_date: farFutureDate,
      },
    ];

    for (const t of tasks) {
      await query(
        `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, t.title, t.description, t.status, t.priority, t.due_date]
      );
    }

    logger.info(`Inserted ${tasks.length} seed tasks for demo user.`);
    logger.info('Database seeded successfully!');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to seed database');
    process.exitCode = 1;
    throw err;
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  seedData()
    .then(() => {
      logger.info('Seed process complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = seedData;
