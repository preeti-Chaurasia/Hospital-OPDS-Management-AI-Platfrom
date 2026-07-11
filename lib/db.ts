// lib/db.ts
import { Pool } from 'pg';

// Initialize pool configuration automatically using the string from your .env.local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required safely for serverless Neon database pooling connections
  }
});

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