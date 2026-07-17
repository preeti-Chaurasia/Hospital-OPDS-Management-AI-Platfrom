import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {

    // -------------------------
    // Dashboard Stats
    // -------------------------

    const todayPatients = await db.query(`
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE appointment_date = CURRENT_DATE
    `);

    const liveQueue = await db.query(`
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE status='In Queue'
    `);

    const occupiedBeds = await db.query(`
      SELECT COUNT(*) AS total
      FROM hospital_beds
      WHERE status='Occupied'
    `);

    const availableBeds = await db.query(`
      SELECT COUNT(*) AS total
      FROM hospital_beds
      WHERE status='Available'
    `);

    const vacatingBeds = await db.query(`
      SELECT COUNT(*) AS total
      FROM hospital_beds
      WHERE status='Vacating Soon'
    `);



    // -------------------------
    // Department Throughput
    // -------------------------
console.log("1 Done");
    const departmentChart = await db.query(`
SELECT
EXTRACT(HOUR FROM appointment_time) AS hour,
COUNT(*) AS patients
FROM appointments
GROUP BY EXTRACT(HOUR FROM appointment_time)
ORDER BY hour;
    `);



    // -------------------------
    // Live Event Stream
    // -------------------------
console.log("2 Done");
    const liveEvents = await db.query(`
   SELECT
event_id,
event_type,
description,
created_at
FROM system_events
ORDER BY created_at DESC
LIMIT 10;
    `);



    // -------------------------
    // Ward Statistics
    // -------------------------
console.log("3 Done");
    const wardStats = await db.query(`
    SELECT
ward_name,
COUNT(*) FILTER (WHERE status='Occupied') AS occupied,
COUNT(*) AS total,
ROUND(
(COUNT(*) FILTER (WHERE status='Occupied')::decimal /
NULLIF(COUNT(*),0))*100,
0
) AS occupancy
FROM hospital_beds
GROUP BY ward_name
ORDER BY ward_name;
    `);



    // -------------------------
    // Critical Alerts
    // -------------------------
console.log("4 Done");
    const criticalAlerts = await db.query(`
    SELECT
ia.alert_id,
m.medicine_name,
ia.alert_type,
ia.current_stock,
ia.severity,
ia.ai_recommendation,
ia.created_at
FROM inventory_alerts ia
JOIN medicines m
ON ia.medicine_id = m.medicine_id
ORDER BY ia.created_at DESC
LIMIT 10;
    `);



    return NextResponse.json({

      stats:{

        todayPatients:Number(todayPatients.rows[0].total),

        liveQueue:Number(liveQueue.rows[0].total),

        occupiedBeds:Number(occupiedBeds.rows[0].total),

        availableBeds:Number(availableBeds.rows[0].total),

        vacatingBeds:Number(vacatingBeds.rows[0].total)

      },

      departmentChart:departmentChart.rows,

      liveEvents:liveEvents.rows,

      wardStats:wardStats.rows,

      criticalAlerts:criticalAlerts.rows

    });

  }

  catch(err){

    console.error(err);

    return NextResponse.json(

      {

        success:false,

        message:"Database Error"

      },

      {

        status:500

      }

    );

  }

}