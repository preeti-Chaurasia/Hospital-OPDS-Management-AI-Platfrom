import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"



export async function POST(req: NextRequest) {


try {


const body = await req.json()


const {
appointment_id,
doctor_id,
medicines
}=body



if(!appointment_id || !medicines?.length){

return NextResponse.json(
{
message:"Missing prescription data"
},
{
status:400
}
)

}



// Loop every medicine

for(const medicine of medicines){


const {
name,
dosage,
frequency,
duration,
instructions,
quantity
}=medicine
const medicineQuantity = quantity || 1
console.log("Prescription Medicine:",{
name,
quantity
})


// 1. Check medicine stock

const stockResult = await db.query(
`
SELECT medicine_id,current_stock
FROM medicines
WHERE medicine_name=$1
`,
[name]
)



if(stockResult.rows.length===0){

return NextResponse.json(
{
message:`${name} not found`
},
{
status:404
}
)

}



const medicineData = stockResult.rows[0]



// 2. Check available stock

if(medicineData.current_stock < medicineQuantity){


return NextResponse.json(
{
message:`${name} is out of stock`
},
{
status:400
}
)

}



// 3. Insert prescription

await db.query(

`
INSERT INTO prescriptions
(
appointment_id,
doctor_id,
medicine_name,
dosage,
frequency,
duration,
instructions,
status
)

VALUES
($1,$2,$3,$4,$5,$6,$7,'Pending')

`,
[
appointment_id,
doctor_id,
name,
dosage,
frequency,
duration,
instructions
]

)


// 4. Reduce medicine stock


await db.query(

`
UPDATE medicines

SET 
current_stock=current_stock-$1,
updated_at=NOW()

WHERE medicine_name=$2

`,
[
medicineQuantity,
name
]

)

await db.query(

`
UPDATE medicines

SET status =

CASE

WHEN current_stock = 0
THEN 'Out of Stock'


WHEN current_stock < 30
THEN 'Low Stock'


ELSE 'Healthy'


END,

updated_at=NOW()

WHERE medicine_name=$1

`,
[
name
]

)

}



return NextResponse.json(
{
success:true,
message:"Prescription saved and stock updated"
}
)



}

catch(error){


console.log(error)


return NextResponse.json(
{
message:"Prescription failed"
},
{
status:500
}
)


}



}