import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"


export async function POST(req:NextRequest){

try{


const body = await req.json()


const {
appointment_id,
patient_id,
bed_id,
doctor_id
}=body



if(
!appointment_id ||
!patient_id ||
!bed_id
){

return NextResponse.json(
{
message:"Missing admission data"
},
{
status:400
}
)

}



// 1. Create admission record

await db.query(

`
INSERT INTO admission_pipeline
(
appointment_id,
patient_id,
doctor_id,
bed_id,
status,
created_at
)

VALUES
($1,$2,$3,$4,'Admitted',NOW())

`,

[
appointment_id,
patient_id,
doctor_id,
bed_id
]

)



// 2. Update bed status


await db.query(

`
UPDATE hospital_beds

SET
status='Occupied',
occupied_by=$1,
last_updated=NOW()

WHERE bed_id=$2

`,

[
patient_id,
bed_id
]

)



// 3. Update appointment status


await db.query(

`
UPDATE appointments

SET status='Admitted'

WHERE appointment_id=$1

`,

[
appointment_id
]

)



return NextResponse.json(
{
success:true,
message:"Patient admitted successfully"
}
)


}
catch(error){

console.log(error)


return NextResponse.json(
{
success:false,
message:"Admission failed"
},
{
status:500
}
)

}

}