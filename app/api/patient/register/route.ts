import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {

    try{

        const body = await req.json();

    const {

full_name,
phone,
age,
gender,
chief_complaint,

owner_patient_id,
relationship

}=body;
        //------------------------------------------------
        // Insert Patient
        //------------------------------------------------

        const patient = await db.query(

            `
            INSERT INTO patients
            (
                full_name,
                phone,
                age,
                gender,
                chief_complaint
            )

            VALUES
            ($1,$2,$3,$4,$5)

            RETURNING patient_id
            `,

            [
                full_name,
                phone,
                age,
                gender,
                chief_complaint
            ]

        );

        const patientId = patient.rows[0].patient_id;
if(relationship){

await db.query(
`
INSERT INTO family_members
(
owner_patient_id,
member_patient_id,
relationship
)

VALUES

($1,$2,$3)
`,
[
owner_patient_id || patientId,
patientId,
relationship
]
);

}
        //------------------------------------------------
        // Appointment
        //------------------------------------------------

        const appointment = await db.query(

            `
            INSERT INTO appointments
            (
                patient_id,
                token_number,
                department,
                doctor_name,
                appointment_date,
                appointment_time,
                queue_position,
                estimated_wait,
                status
)

VALUES
(
    $1,
    CONCAT('A-',floor(random()*900+100)),
    'General Medicine',
    'Dr. Amelia',
    CURRENT_DATE,
    CURRENT_TIME,
    1,
    10,
    'In Queue'
)

            RETURNING appointment_id
            `,
            [patientId]

        );
          const appointmentId = appointment.rows[0].appointment_id;

          console.log(
"Patient Created:",
patientId,
"Appointment Created:",
appointmentId
);
await db.query(
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
VALUES
(
    $1,
    3,
    'BED-008',
    92,
    'Dr Amelia Shaw',
    'J Okonkwo',
    'General Medicine',
    22
)
`,
[appointmentId]
);
        return NextResponse.json({
    success: true,
    patientId,
    appointmentId
});

    }

    catch(err){

        console.log(err);

        return NextResponse.json(
            {success:false},
            {status:500}
        );

    }

}