import {NextRequest,NextResponse} from "next/server"
import {db} from "@/lib/db"



export async function POST(req:NextRequest){


try{


const body=await req.json()


const {
appointment_id,
patient_id,
doctor_id,
test_name,
priority
}=body



if(
!appointment_id ||
!patient_id ||
!test_name
){

return NextResponse.json(
{
message:"Missing lab data"
},
{
status:400
}
)

}



await db.query(

`
INSERT INTO lab_orders
(
appointment_id,
patient_id,
doctor_id,
test_name,
priority,
status
)

VALUES
($1,$2,$3,$4,$5,'Pending')

`,

[
appointment_id,
patient_id,
doctor_id,
test_name,
priority || "Normal"
]

)



return NextResponse.json(
{
success:true,
message:"Lab request created"
}
)



}
catch(error){

console.log(error)


return NextResponse.json(
{
success:false,
message:"Lab request failed"
},
{
status:500
}
)

}

}