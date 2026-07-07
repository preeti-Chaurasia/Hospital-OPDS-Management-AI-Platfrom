import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ========================================================
// GET: Patient ka poora live status aur workflow fetch karna
// ========================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }

    // 1. Fetch Patient Token Master Data
    const tokenResult = await pool.query(
      'SELECT * FROM patient_tokens WHERE patient_id = $1',
      [patientId]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient data not found' }, { status: 404 });
    }

    const patientData = tokenResult.rows[0];
    const tokenNumber = patientData.token_number;

    let vitals = null;
    let prescriptions = [];
    let labReports = [];

    // Agar Token generated hai, toh baki details pull karne ki koshish karo
    if (tokenNumber) {
      // 2. Fetch Vitals (Agar triage_status 'Ready' hai toh vitals data zarur hoga)
      const vitalsResult = await pool.query(
        'SELECT * FROM patient_vitals WHERE token_number = $1 ORDER BY recorded_at DESC LIMIT 1',
        [tokenNumber]
      );
      vitals = vitalsResult.rows[0] || null;

      // 🔴 CRITICAL CONSTRAINT CHECK:
      // Medicines aur Lab Reports tabhi dikhengii jab Doctor consultation 'Completed' ho chuka ho!
      if (patientData.current_status === 'Completed') {
        
        // Fetch Prescriptions
        const prescResult = await pool.query(
          'SELECT * FROM patient_prescriptions WHERE token_number = $1',
          [tokenNumber]
        );
        prescriptions = prescResult.rows;

        // Fetch Lab Reports
        const labResult = await pool.query(
          'SELECT * FROM patient_lab_reports WHERE token_number = $1',
          [tokenNumber]
        );
        labReports = labResult.rows;
      }
    }

    // Response structure supporting all 4 lifecycle states dynamically
    return NextResponse.json({
      success: true,
      stateInfo: {
        isTokenGenerated: !!tokenNumber,
        isVitalsChecked: patientData.triage_status === 'Ready',
        isConsultationDone: patientData.current_status === 'Completed',
      },
      patient: patientData,
      vitals: vitals,
      prescriptions: prescriptions, // Will be [] if not completed
      labReports: labReports        // Will be [] if not completed
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ========================================================
// POST: State 1 se State 2 mein convert karne ke liye (Generate Token)
// ========================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, symptoms } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }

    // Auto-generate next token number (E.g., A-130, A-131...)
    const lastTokenResult = await pool.query(
      "SELECT token_number FROM patient_tokens WHERE token_number LIKE 'A-%' ORDER BY created_at DESC LIMIT 1"
    );
    
    let nextToken = 'A-101'; // Default first token if table empty
    if (lastTokenResult.rows.length > 0 && lastTokenResult.rows[0].token_number) {
      const lastNum = parseInt(lastTokenResult.rows[0].token_number.split('-')[1]);
      nextToken = `A-${lastNum + 1}`;
    }

    // Create a mock MRN Number for hackathon simulation
    const randomMRN = `MRN-4441-${Math.floor(10 + Math.random() * 90)}`;

    // Update patient record from State 1 to State 2
    const updatedPatient = await pool.query(
      `UPDATE patient_tokens 
       SET token_number = $1, 
           mrn_number = $2,
           symptoms_text = $3,
           current_status = 'In Queue',
           triage_status = 'Pending', -- Nurse pre-check is now pending
           qr_checked_in = TRUE
       WHERE patient_id = $4 RETURNING *`,
      [nextToken, randomMRN, symptoms || 'General Checkup', patientId]
    );

    return NextResponse.json({
      success: true,
      message: 'Token generated successfully!',
      patient: updatedPatient.rows[0]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}