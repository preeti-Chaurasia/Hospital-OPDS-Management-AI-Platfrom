import { NextResponse } from "next/server"
import { db } from "@/lib/db"


export async function GET(){

try{


const result = await db.query(`

SELECT

l.lab_order_id,
l.test_name,
l.priority,
l.status,
l.created_at,

p.patient_id,
p.full_name,
p.age,
p.gender,

a.token_number


FROM lab_orders l


JOIN patients p

ON l.patient_id = p.patient_id


JOIN appointments a

ON l.appointment_id = a.appointment_id


WHERE l.status='Pending'


ORDER BY l.created_at ASC


`)



return NextResponse.json(
result.rows
)


}
catch(error){

console.log(error)


return NextResponse.json(
{
message:"Failed to load lab orders"
},
{
status:500
}
)

}


}