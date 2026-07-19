"use client"

import {useState} from "react"


export default function ReportUploadModal(
{
order,
close
}:any
){


const [reportUrl,setReportUrl]=useState("")
const [remarks,setRemarks]=useState("")


const uploadReport=async()=>{


const res = await fetch(
"/api/lab/report-upload",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

lab_order_id:order.lab_order_id,

report_url:reportUrl,

remarks

})

}

)


const data=await res.json()


if(data.success){

alert("Report Uploaded")

close()

}


}



return(

<div className="fixed inset-0 bg-black/40 flex items-center justify-center">


<div className="bg-white p-5 rounded-lg w-96">


<h2 className="font-bold text-lg">
Upload Report
</h2>


<p className="text-sm">
Patient: {order.full_name}
</p>


<input

placeholder="Report PDF URL"

className="border p-2 w-full mt-3"

value={reportUrl}

onChange={(e)=>setReportUrl(e.target.value)}

/>


<textarea

placeholder="Remarks"

className="border p-2 w-full mt-3"

value={remarks}

onChange={(e)=>setRemarks(e.target.value)}

/>



<button

onClick={uploadReport}

className="bg-green-600 text-white px-4 py-2 mt-3 rounded"

>
Submit Report
</button>


</div>


</div>

)

}