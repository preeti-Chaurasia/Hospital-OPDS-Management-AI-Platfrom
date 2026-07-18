import { NextResponse } from "next/server"
import {db}from "@/lib/db"


export async function GET(){

try{

const result = await db.query(`

SELECT
medicine_id,
medicine_name,
current_stock,
max_stock,
status,
rack_location

FROM medicines

ORDER BY medicine_name ASC

`)


return NextResponse.json(result.rows)


}
catch(error){

console.log(error)

return NextResponse.json(
{
error:"Medicine fetch failed"
},
{
status:500
}
)

}

}