import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {

    try {

        //----------------------------------------
        // Today's Prescriptions
        //----------------------------------------

        const prescriptions = await db.query(`
            SELECT COUNT(*) AS total
            FROM prescriptions
        `);

        //----------------------------------------
        // Ready For Pickup
        //----------------------------------------

        const readyPickup = await db.query(`
            SELECT COUNT(*) AS total
FROM pharmacy_orders
WHERE order_status='Waiting at Counter';
        `);

        //----------------------------------------
        // Low Stock
        //----------------------------------------

        const lowStock = await db.query(`
            SELECT COUNT(*) AS total
            FROM inventory_alerts
            WHERE alert_type='Low Stock'
        `);

        //----------------------------------------
        // Out Of Stock
        //----------------------------------------

        const outStock = await db.query(`
            SELECT COUNT(*) AS total
FROM medicine_inventory
WHERE current_stock=0
        `);

        //----------------------------------------
// Medicine Inventory
//----------------------------------------

const inventory = await db.query(`
SELECT
    inventory_id,
    medicine_name,
    current_stock,
    reorder_level,
    rack_location,
    expiry_date
FROM medicine_inventory
ORDER BY medicine_name ASC
`);

        //----------------------------------------
        // Live Queue
        //----------------------------------------

        const queue = await db.query(`

SELECT
    pr.prescription_id,
    p.full_name,
    a.doctor_name,
    pr.medicine_name AS medicines,
    COALESCE(po.order_status, 'New Order') AS order_status
FROM prescriptions pr
JOIN appointments a
    ON pr.appointment_id = a.appointment_id
JOIN patients p
    ON a.patient_id = p.patient_id
LEFT JOIN pharmacy_orders po
    ON po.prescription_id = pr.prescription_id
ORDER BY pr.prescription_id DESC;

        `);

        //----------------------------------------
        // Activity Log
        //----------------------------------------

        const activity = await db.query(`
            SELECT *
            FROM activity_logs
            ORDER BY created_at DESC
            LIMIT 10
        `);

     return NextResponse.json({

  stats: {
    todayPrescriptions: Number(prescriptions.rows[0].total),

    readyPickup: Number(readyPickup.rows[0].total),

    lowStock: Number(lowStock.rows[0].total),

    outOfStock: Number(outStock.rows[0].total),
  },

  prescriptions: queue.rows,

  inventory: inventory.rows,

  activity: activity.rows,

});

    }

    catch(err){

        console.log(err);

        return NextResponse.json(
            {message:"Database Error"},
            {status:500}
        );

    }

}