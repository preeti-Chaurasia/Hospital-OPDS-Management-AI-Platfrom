import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"


export async function POST(req:NextRequest){

try{


const body = await req.json()


const {
  appointment_id,
  doctor_id,
  diagnosis_code,
  progress_note
} = body



if(!appointment_id){

return NextResponse.json(
{
message:"Appointment missing"
},
{
status:400
}
)

}



// save doctor notes

await db.query(

`
INSERT INTO doctor_notes
(
appointment_id,
doctor_id,
diagnosis_code,
progress_note,
created_at
)

VALUES
($1,$2,$3,$4,NOW())

`,

[
  appointment_id,
  doctor_id,
  diagnosis_code,
  progress_note
]

)



return NextResponse.json(
{
success:true,
message:"Clinical notes saved"
}
)


}
catch(error){

console.log(error)


return NextResponse.json(
{
success:false,
message:"Failed to save notes"
},
{
status:500
}
)


}

}