const { Pool } = require('pg');

// Customer DB Configuration Credentials - using env parameters or dummy local fallbacks
const customerDbConfig = {
  host: process.env.CUSTOMER_DB_HOST || 'localhost',
  port: parseInt(process.env.CUSTOMER_DB_PORT || '5432'),
  user: process.env.CUSTOMER_DB_USER || 'postgres',
  password: process.env.CUSTOMER_DB_PASSWORD || 'postgres',
  database: process.env.CUSTOMER_DB_NAME || 'customer_db',
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.CUSTOMER_DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
};

// Partner DB Configuration Credentials - using env parameters or dummy local fallbacks
const partnerDbConfig = {
  host: process.env.PARTNER_DB_HOST || 'localhost',
  port: parseInt(process.env.PARTNER_DB_PORT || '5432'),
  user: process.env.PARTNER_DB_USER || 'postgres',
  password: process.env.PARTNER_DB_PASSWORD || 'postgres',
  database: process.env.PARTNER_DB_NAME || 'partner_db',
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.PARTNER_DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
};

let customerPool = null;
let partnerPool = null;

try {
  customerPool = new Pool(customerDbConfig);
  console.log('[DB Config] Customer Database Connection Pool successfully initialized.');
} catch (err) {
  console.error('[DB Config Error] Customer DB Pool initialization failed:', err.message);
}

try {
  partnerPool = new Pool(partnerDbConfig);
  console.log('[DB Config] Partner Database Connection Pool successfully initialized.');
} catch (err) {
  console.error('[DB Config Error] Partner DB Pool initialization failed:', err.message);
}

module.exports = {
  customerPool,
  partnerPool
};
