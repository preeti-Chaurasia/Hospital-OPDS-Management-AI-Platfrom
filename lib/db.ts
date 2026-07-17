// lib/db.ts
import { Pool } from 'pg';

// Initialize pool configuration automatically using the string from your .env.local
const globalForPg = global as unknown as {
  pool?: Pool;
};

export const pool =
  globalForPg.pool ??
  new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl:{
      rejectUnauthorized:false
    },

    max:3,

    idleTimeoutMillis:60000,

    connectionTimeoutMillis:20000,

    keepAlive:true,

  });
  
if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool;
}

export const db = {
  /**
   * Universal function to execute raw SQL queries securely
   * @param text Raw SQL command string (e.g. 'SELECT * FROM beds WHERE status = $1')
   * @param params Dynamic sanitation injection variables array
   */
  query: async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed SQL Query smoothly:', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database connection error triggered:', error);
      throw error;
    }
  }
};