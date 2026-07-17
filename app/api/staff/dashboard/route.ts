import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {

    const todaysPatients = await db.query(`
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE appointment_date = CURRENT_DATE
    `);

    const liveQueue = await db.query(`
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE status='In Queue'
    `);

    const pendingLabs = await db.query(`
      SELECT COUNT(*) AS total
      FROM lab_reports
      WHERE status!='Ready'
    `);

    const uploadedReports = await db.query(`
      SELECT COUNT(*) AS total
      FROM generated_reports
      WHERE status='Ready'
    `);

    const queue = await db.query(`
SELECT
a.appointment_id,
a.token_number,
a.status,
a.doctor_name,
a.estimated_wait,
a.queue_position,
a.priority,
p.full_name,
p.age,
p.gender,
p.chief_complaint
FROM appointments a
JOIN patients p
ON a.patient_id=p.patient_id
ORDER BY a.queue_position
    `);

const activity = await db.query(`
SELECT
    al.activity_id,
    al.activity_type,
    al.performed_by,
    al.role,

    p.full_name,
    a.token_number

FROM activity_logs al

LEFT JOIN appointments a
ON al.appointment_id=a.appointment_id

LEFT JOIN patients p
ON al.patient_id=p.patient_id

ORDER BY al.activity_id DESC
LIMIT 10
`);
    const labTests = await db.query(`
SELECT
    l.report_id,
    l.report_name,
    l.status,
    l.requested_time,

    p.full_name,
    a.token_number,
    a.doctor_name

FROM lab_reports l

JOIN appointments a
ON l.appointment_id = a.appointment_id

JOIN patients p
ON a.patient_id = p.patient_id

ORDER BY l.requested_time DESC
`);

    return NextResponse.json({
      stats: {
        todaysPatients: Number(todaysPatients.rows[0].total),
        liveQueue: Number(liveQueue.rows[0].total),
        pendingDiagnostics: Number(pendingLabs.rows[0].total),
        uploadedToday: Number(uploadedReports.rows[0].total),
      },
      queue: queue.rows,
      activity: activity.rows,
      labTests:labTests.rows
    });

  } catch (err) {
    console.log(err);

    return NextResponse.json(
      { message: "Database Error" },
      { status: 500 }
    );
  }
}