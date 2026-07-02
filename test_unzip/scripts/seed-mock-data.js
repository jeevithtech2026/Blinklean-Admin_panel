const { customerPool, partnerPool } = require('../config/db');

// List of realistic names to generate randomized profile data without external libraries
const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Jessica', 'Robert', 'Karen', 'William', 'Ashley', 'Joseph', 'Amanda', 'Charles', 'Olivia', 'Thomas', 'Sophia', 'Daniel', 'Isabella'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const categories = ['Electronic Scrap', 'Metal Extraction', 'Hazardous Waste', 'Appliance Recycling'];
const services = ['Mainboard Shredding', 'Copper Recovery', 'Chemical Neutralization', 'Lithium Extraction', 'Refrigerator Degassing', 'Gold Smelting', 'Lead Battery Disposal', 'HVAC Recovery', 'Display Panel Shredding', 'Aluminum Sorting'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

// Generate random dates in the past 30 days
function getRandomDate(daysAgo = 30) {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysAgo));
  return date;
}

async function seedCustomerDatabase() {
  if (!customerPool) {
    console.warn('[Seeder Warning] Customer DB pool is not initialized. Skipping Customer DB migrations and seeding.');
    return;
  }

  const client = await customerPool.connect();
  console.log('[Seeder] Starting Customer DB transaction migrations...');

  try {
    await client.query('BEGIN');

    // Create Tables if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) REFERENCES customers(id),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(30) NOT NULL,
        booking_date DATE NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(50) PRIMARY KEY,
        booking_id VARCHAR(50) REFERENCES bookings(id),
        completion_date DATE NOT NULL,
        status VARCHAR(30) NOT NULL
      )
    `);

    console.log('[Seeder] Customer DB schemas successfully verified.');

    // Clean existing data for clean seed executions
    await client.query('TRUNCATE TABLE services CASCADE');
    await client.query('TRUNCATE TABLE bookings CASCADE');
    await client.query('TRUNCATE TABLE customers CASCADE');

    // Generate 120 Customers
    const customerIds = [];
    const customerInserts = [];
    for (let i = 1; i <= 120; i++) {
      const id = `C-${1000 + i}`;
      const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const email = `${name.toLowerCase().replace(/ /g, '.')}@example.com`;
      const regDate = getRandomDate(30).toISOString();
      customerIds.push(id);

      customerInserts.push(
        client.query('INSERT INTO customers (id, name, email, registered_at) VALUES ($1, $2, $3, $4)', [id, name, email, regDate])
      );
    }
    await Promise.all(customerInserts);
    console.log(`[Seeder] Seeded ${customerIds.length} customer records.`);

    // Generate 350 Bookings
    const bookingIds = [];
    const bookingInserts = [];
    const statuses = ['completed', 'completed', 'completed', 'cancelled', 'abandoned'];

    for (let i = 1; i <= 350; i++) {
      const id = `B-${2000 + i}`;
      const custId = getRandomItem(customerIds);
      const amount = getRandomFloat(20, 250);
      const status = getRandomItem(statuses);
      const bookDate = getRandomDate(30).toISOString().split('T')[0];
      bookingIds.push({ id, status, bookDate });

      bookingInserts.push(
        client.query('INSERT INTO bookings (id, customer_id, amount, status, booking_date) VALUES ($1, $2, $3, $4, $5)', [id, custId, amount, status, bookDate])
      );
    }
    await Promise.all(bookingInserts);
    console.log(`[Seeder] Seeded ${bookingIds.length} booking records.`);

    // Generate Services for completed bookings
    const serviceInserts = [];
    let seededServicesCount = 0;
    bookingIds.forEach((b) => {
      if (b.status === 'completed') {
        const srvId = `S-${3000 + seededServicesCount}`;
        const completionDate = b.bookDate; // Complete on same day
        serviceInserts.push(
          client.query('INSERT INTO services (id, booking_id, completion_date, status) VALUES ($1, $2, $3, $4)', [srvId, b.id, completionDate, 'completed'])
        );
        seededServicesCount++;
      }
    });
    await Promise.all(serviceInserts);
    console.log(`[Seeder] Seeded ${seededServicesCount} service completion records.`);

    await client.query('COMMIT');
    console.log('[Seeder] Customer DB Transaction successfully committed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seeder Error] Customer DB seeding aborted. Rollback executed:', err.message);
  } finally {
    client.release();
  }
}

async function seedPartnerDatabase() {
  if (!partnerPool) {
    console.warn('[Seeder Warning] Partner DB pool is not initialized. Skipping Partner DB migrations and seeding.');
    return;
  }

  const client = await partnerPool.connect();
  console.log('[Seeder] Starting Partner DB transaction migrations...');

  try {
    await client.query('BEGIN');

    // Create Tables if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_performance (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        completed_count INT NOT NULL,
        rating DECIMAL(3, 2) NOT NULL,
        highest_rated_service VARCHAR(100) NOT NULL,
        earnings DECIMAL(10, 2) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scraps_logistics (
        id VARCHAR(50) PRIMARY KEY,
        collection_date DATE NOT NULL,
        total_weight DECIMAL(10, 2) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_earnings (
        id VARCHAR(50) PRIMARY KEY,
        partner_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        earned_at DATE NOT NULL
      )
    `);

    console.log('[Seeder] Partner DB schemas successfully verified.');

    // Clean existing data for clean seed executions
    await client.query('TRUNCATE TABLE partner_performance CASCADE');
    await client.query('TRUNCATE TABLE scraps_logistics CASCADE');
    await client.query('TRUNCATE TABLE partner_earnings CASCADE');

    // Generate 25 Partners
    const partnerIds = [];
    const partnerInserts = [];
    for (let i = 1; i <= 25; i++) {
      const id = `P-${100 + i}`;
      const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const cat = getRandomItem(categories);
      const completed = getRandomInt(5, 50);
      const rating = getRandomFloat(4.0, 5.0, 1);
      const highestService = getRandomItem(services);
      const earnings = getRandomFloat(100, 3000);
      partnerIds.push(id);

      partnerInserts.push(
        client.query('INSERT INTO partner_performance (id, name, category, completed_count, rating, highest_rated_service, earnings) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
          [id, name, cat, completed, rating, highestService, earnings])
      );
    }
    await Promise.all(partnerInserts);
    console.log(`[Seeder] Seeded ${partnerIds.length} partner performance profiles.`);

    // Generate 150 daily scraps_logistics entries (over last 30 days)
    const scrapInserts = [];
    let scrapRecordId = 1;
    // For each day in the last 30 days, generate 5-6 collections
    for (let d = 0; d < 30; d++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - d);
      const dateStr = targetDate.toISOString().split('T')[0];

      // 5 collections per day
      for (let c = 0; c < 5; c++) {
        const id = `L-${1000 + scrapRecordId}`;
        const weight = getRandomFloat(20, 500);
        scrapInserts.push(
          client.query('INSERT INTO scraps_logistics (id, collection_date, total_weight) VALUES ($1, $2, $3)', [id, dateStr, weight])
        );
        scrapRecordId++;
      }
    }
    await Promise.all(scrapInserts);
    console.log(`[Seeder] Seeded ${scrapRecordId - 1} scraps logs records.`);

    // Generate 200 Partner Earnings transactions
    const earningsInserts = [];
    for (let i = 1; i <= 200; i++) {
      const id = `E-${5000 + i}`;
      const partId = getRandomItem(partnerIds);
      const amount = getRandomFloat(10, 500);
      const earnedAt = getRandomDate(30).toISOString().split('T')[0];

      earningsInserts.push(
        client.query('INSERT INTO partner_earnings (id, partner_id, amount, earned_at) VALUES ($1, $2, $3, $4)', [id, partId, amount, earnedAt])
      );
    }
    await Promise.all(earningsInserts);
    console.log(`[Seeder] Seeded ${200} partner earnings transaction records.`);

    await client.query('COMMIT');
    console.log('[Seeder] Partner DB Transaction successfully committed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seeder Error] Partner DB seeding aborted. Rollback executed:', err.message);
  } finally {
    client.release();
  }
}

async function runSeed() {
  console.log('[Seeder] Starting DB Seeding Orchestration...');
  await seedCustomerDatabase();
  await seedPartnerDatabase();
  console.log('[Seeder] Seeding Orchestration finished.');
}

runSeed();
