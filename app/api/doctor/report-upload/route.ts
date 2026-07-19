import {NextRequest,NextResponse} from "next/server"
import {db} from "@/lib/db"


export async function POST(req:NextRequest){

try{


const body = await req.json()


const {
lab_order_id,
report_url,
remarks
}=body



await db.query(

`
INSERT INTO lab_reports

(
lab_order_id,
report_url,
remarks,
created_at
)

VALUES
($1,$2,$3,NOW())

`,

[
lab_order_id,
report_url,
remarks
]

)



await db.query(

`
UPDATE lab_orders

SET status='Completed'

WHERE lab_order_id=$1

`,

[
lab_order_id
]

)



return NextResponse.json(
{
success:true,
message:"Report uploaded"
}
)


}
catch(error){

console.log(error)


return NextResponse.json(
{
success:false
},
{
status:500
}
)

}

}