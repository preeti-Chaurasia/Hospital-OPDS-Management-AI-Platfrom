import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, phone_number, role_requested } = body; 

    if (!username || !role_requested) {
      return NextResponse.json({ authenticated: false, error: 'Username aur Role dena zaroori hai!' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanPhone = phone_number ? phone_number.trim() : "9876543203";

    // ─── DOCTOR LOGIN ROUTE ───
    if (role_requested === 'doctor') {
      const result = await pool.query(
        'SELECT * FROM doctors WHERE LOWER(name) = LOWER($1)',
        [cleanUsername]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ authenticated: false, error: `Doctor '${cleanUsername}' database mein nahi mila!` }, { status: 404 });
      }

      // page.tsx layout mapping standard matching data contracts
      return NextResponse.json({
        authenticated: true,
        role: 'doctor',
        user_identity: result.rows[0].name,
        doctor_id: result.rows[0].doctor_id
      }, { status: 200 });
    } 
    
    // ─── PATIENT LOGIN / AUTO-REGISTER ROUTE ───
    else if (role_requested === 'patient') {
      // Step A: Check database profile history elements
      const checkUser = await pool.query(
        'SELECT * FROM patient_tokens WHERE LOWER(patient_name) = LOWER($1)',
        [cleanUsername]
      );

      if (checkUser.rows.length > 0) {
        // Purana User mil gaya!
        return NextResponse.json({
          authenticated: true,
          role: 'patient',
          user_identity: checkUser.rows[0].patient_name,
          phone_number: checkUser.rows[0].phone_number,
          token_number: checkUser.rows[0].token_number || null
        }, { status: 200 });
      } else {
        // Step B: Naya User -> Auto-generate immediate serial order token matching schema bounds
        const lastTokenRes = await pool.query(
          "SELECT token_number FROM patient_tokens WHERE token_number LIKE 'A-%' ORDER BY token_number DESC LIMIT 1"
        );
        
        let nextToken = 'A-101';
        if (lastTokenRes.rows.length > 0 && lastTokenRes.rows[0].token_number) {
          const lastNum = parseInt(lastTokenRes.rows[0].token_number.split('-')[1]);
          nextToken = `A-${lastNum + 1}`;
        }

        const randomMRN = `MRN-4441-${Math.floor(30 + Math.random() * 60)}`;

        // Insertion execution ensuring schema constraint rules aren't violated
        const newUser = await pool.query(
          `INSERT INTO patient_tokens (mrn_number, patient_name, age, phone_number, symptoms_text, token_number, triage_status, current_status) 
           VALUES ($1, $2, $3, $4, $5, $6, 'Pending', 'In Queue') RETURNING *`,
          [randomMRN, cleanUsername, 25, cleanPhone, 'OPD Screening Consultation Request', nextToken]
        );

        return NextResponse.json({
          authenticated: true,
          role: 'patient',
          user_identity: newUser.rows[0].patient_name,
          phone_number: newUser.rows[0].phone_number,
          token_number: newUser.rows[0].token_number
        }, { status: 200 });
      }
    }

    return NextResponse.json({ authenticated: false, error: 'Invalid role request parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}