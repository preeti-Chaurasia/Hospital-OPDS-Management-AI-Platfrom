import { NextResponse } from "next/server"
import { db } from "@/lib/db"


export async function GET(){

try{


const result = await db.query(`

SELECT

a.appointment_id,
a.token_number,
a.queue_position,
a.estimated_wait,
a.priority,
a.status,


p.patient_id,
p.full_name,
p.age,
p.gender,
p.chief_complaint,


v.blood_pressure,
v.heart_rate,
v.temperature,
v.spo2


FROM appointments a


JOIN patients p

ON a.patient_id = p.patient_id



LEFT JOIN patient_vitals v

ON a.appointment_id = v.appointment_id



WHERE 
a.status IN ('Waiting','Checked In','Processing')


ORDER BY a.queue_position ASC


`)



const queue = result.rows.map((row)=>({
 id: row.patient_id,
appointmentId: row.appointment_id,


token: row.token_number,


name: row.full_name,


age: row.age,


sex: row.gender,


complaint: row.chief_complaint,


priority:
row.priority === "stable"
? "low"
: row.priority,


waitMins: row.estimated_wait,


status: row.status,


vitals:{


bp: row.blood_pressure || "N/A",


hr: row.heart_rate || 0,


temp: row.temperature || 0,


spo2: row.spo2 || 0


}



}))



return NextResponse.json(queue)



}

catch(error){


console.log(error)


return NextResponse.json(
{
error:"Failed to load doctor queue"
},
{
status:500
}
)


}


}