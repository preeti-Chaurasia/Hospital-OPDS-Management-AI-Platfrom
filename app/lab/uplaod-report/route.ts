import {NextRequest, NextResponse} from "next/server"
import {db} from "@/lib/db"


export async function POST(req:NextRequest){

try{


const body = await req.json()


const {
report_id,
file_path,
remarks,
uploaded_by
}=body



const result = await db.query(

`
UPDATE lab_reports

SET

status='Completed',
file_path=$1,
remarks=$2,
uploaded_by=$3,
uploaded_at=NOW()

WHERE report_id=$4

RETURNING *

`,

[
file_path,
remarks,
uploaded_by,
report_id
]


)



return NextResponse.json({

success:true,
report:result.rows[0]

})


}

catch(error){

console.log(error)


return NextResponse.json(
{
success:false,
message:"Upload failed"
},
{
status:500
}
)

}

}