import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";


// ================================
// GET ADMISSION PIPELINE DATA
// ================================
export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url);

    const appointmentId = searchParams.get("appointmentId");


    if (!appointmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "appointmentId is required"
        },
        {
          status: 400
        }
      );
    }


    const result = await db.query(
      `
      SELECT

        ap.pipeline_id,
        ap.appointment_id,
        ap.current_stage,
        ap.predicted_room,
        ap.room_match,
        ap.doctor_name,
        ap.nurse_name,
        ap.target_ward,
        ap.eta_to_bed,


        a.token_number,
        a.department,
        a.status,
        a.priority,
        a.estimated_wait,


        p.patient_id,
        p.full_name,
        p.age,
        p.gender


      FROM admission_pipeline ap


      JOIN appointments a
      ON a.appointment_id = ap.appointment_id


      JOIN patients p
      ON p.patient_id = a.patient_id


      WHERE ap.appointment_id=$1

      `,
      [
        appointmentId
      ]
    );

if(result.rows.length === 0){

 
const bed = await db.query(
`
SELECT
bed_number,
ward_name
FROM hospital_beds
WHERE status='available'
ORDER BY bed_id
LIMIT 1
`
);


let predictedRoom=null;
let ward=null;


if(bed.rows.length>0){

 predictedRoom = bed.rows[0].bed_number;
 ward = bed.rows[0].ward_name;

}



const create = await db.query(
`
INSERT INTO admission_pipeline
(
appointment_id,
current_stage,
predicted_room,
room_match,
doctor_name,
nurse_name,
target_ward,
eta_to_bed
)

SELECT

$1,
1,
$2,
90,
doctor_name,
NULL,
$3,
20

FROM appointments

WHERE appointment_id=$1

RETURNING *

`,
[
appointmentId,
predictedRoom,
ward
]

);

 return NextResponse.json({
 success:true,
 data:create.rows[0]
 });

}



    return NextResponse.json(
      {
        success:true,
        data:result.rows[0]
      }
    );


  } catch(error:any){

    console.log(
      "Admission Pipeline GET Error:",
      error
    );


    return NextResponse.json(
      {
        success:false,
        message:error.message
      },
      {
        status:500
      }
    );

  }
}





// ================================
// UPDATE PIPELINE STAGE
// ================================
export async function PATCH(req: NextRequest){

try{

const body = await req.json();

const {
appointmentId,
action
}=body;


if(!appointmentId || !action){

return NextResponse.json({
success:false,
message:"appointmentId and action required"
},{
status:400
})

}



// current stage

const current = await db.query(
`
SELECT current_stage
FROM admission_pipeline
WHERE appointment_id=$1
`,
[
appointmentId
]
)



if(current.rows.length===0){

return NextResponse.json({
success:false,
message:"Pipeline not found"
},{
status:404
})

}



let stage=current.rows[0].current_stage;



if(action==="advance"){

if(stage < 5){
stage++;
}

}
// ================================
// UPDATE DATA ACCORDING TO STAGE
// ================================

let pipelineUpdate:any = {};

switch(stage){

  case 2:

    pipelineUpdate = {
      nurse_name:"Sarah Johnson, RN",
      target_ward:"General Ward"
    };

    break;



  case 3:

    pipelineUpdate = {
      predicted_room:"GEN-12",
      room_match:95,
      eta_to_bed:15
    };

    break;



  case 4:

    pipelineUpdate = {
      predicted_room:"GEN-12",
      room_match:100,
      eta_to_bed:5
    };

    break;



  case 5:

    pipelineUpdate = {
      eta_to_bed:0
    };

    break;

}

if(action==="back"){

if(stage > 1){
stage--;
}

}




// Stage name mapping

const stages:any={

1:"Requested",

2:"Bed Allocation",

3:"Room Assigned",

4:"Admission Processing",

5:"Admitted"

}



const status=stages[stage];




// update pipeline

let room="GEN-08";
let match=92;
let eta=22;
let ward="General Medicine";


// stage based prediction

if(stage===1){

room="GEN-08";
match=92;
eta=22;
ward="General Medicine";

}


if(stage===3){

const availableBed = await db.query(
`
SELECT
bed_number,
ward_name
FROM hospital_beds
WHERE status='available'
ORDER BY bed_id
LIMIT 1
`
);


if(availableBed.rows.length){

room = availableBed.rows[0].bed_number;

ward = availableBed.rows[0].ward_name;

match=95;

eta=10;


}

}




if(stage===4){

room="ICU-03";
match=75;
eta=5;
ward="Critical Care";

}


if(stage===5){

const pipeline = await db.query(
`
SELECT predicted_room
FROM admission_pipeline
WHERE appointment_id=$1
`,
[
appointmentId
]
);

const allocatedRoom = pipeline.rows[0]?.predicted_room;

if(allocatedRoom){

await db.query(
`
UPDATE hospital_beds

SET
status='occupied',

occupied_by=
(
SELECT patient_id
FROM appointments
WHERE appointment_id=$1
),

last_updated=NOW()

WHERE bed_number=$2
`,
[
appointmentId,
allocatedRoom
]
);

}

}




const updated = await db.query(
`
UPDATE admission_pipeline

SET

current_stage=$1,

nurse_name=COALESCE($3,nurse_name),

target_ward=COALESCE($4,target_ward),

predicted_room=COALESCE($5,predicted_room),

room_match=COALESCE($6,room_match),

eta_to_bed=COALESCE($7,eta_to_bed)


WHERE appointment_id=$2

RETURNING *

`,
[
stage,
appointmentId,

pipelineUpdate.nurse_name || null,

pipelineUpdate.target_ward || null,

pipelineUpdate.predicted_room || null,

pipelineUpdate.room_match || null,

pipelineUpdate.eta_to_bed || null

]
);



// update appointment status also

let appointmentStatus="Processing";


if(stage===5){
 appointmentStatus="Admitted";
}


await db.query(
`
UPDATE appointments

SET status=$1

WHERE appointment_id=$2
`,
[
appointmentStatus,
appointmentId
]
);




return NextResponse.json({

success:true,

message:"Pipeline updated",

data:updated.rows[0]

})


}

catch(error:any){

console.log(error)

return NextResponse.json({

success:false,

message:error.message

},{
status:500
})


}


}