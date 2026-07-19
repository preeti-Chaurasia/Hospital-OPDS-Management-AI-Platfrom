"use client"

import {useEffect,useState} from "react"


export default function LabDashboard(){


const [orders,setOrders]=useState<any[]>([])



useEffect(()=>{


const loadOrders=async()=>{


const res=await fetch(
"/api/lab/orders"
)


const data=await res.json()


setOrders(data)


}


loadOrders()


},[])



return(

<div className="p-6">


<h1 className="text-2xl font-bold mb-5">
Lab Dashboard
</h1>



<div className="grid gap-4">


{
orders.map((order)=>(


<div
key={order.lab_order_id}
className="border rounded-lg p-4"
>


<h2 className="font-bold">
{order.test_name}
</h2>


<p>
Patient: {order.full_name}
</p>


<p>
Token: {order.token_number}
</p>


<p>
Priority: {order.priority}
</p>


<p>
Status: {order.status}
</p>



<button

className="mt-3 bg-green-600 text-white px-4 py-2 rounded"

>
Upload Report
</button>


</div>


))
}



</div>


</div>


)


}