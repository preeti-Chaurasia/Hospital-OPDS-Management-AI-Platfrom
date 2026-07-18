import { NextResponse } from "next/server"
import { db } from "@/lib/db"


export async function GET(){

try{

const result = await db.query(`

SELECT
bed_id,
bed_number,
ward_name,
bed_type,
status,
occupied_by,
predicted_available,
last_updated

FROM hospital_beds

ORDER BY bed_id ASC

`)


const beds = result.rows.map((bed)=>({

id: bed.bed_id,

bedNumber: bed.bed_number,

ward: bed.ward_name,

type: bed.bed_type,

status: bed.status,

occupiedBy: bed.occupied_by,

predictedAvailable: bed.predicted_available,

lastUpdated: bed.last_updated


}))


return NextResponse.json(beds)


}
catch(error){

console.log(error)

return NextResponse.json(
{
error:"Failed to load beds"
},
{
status:500
}
)

}

}