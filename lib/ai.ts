import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function chatWithAI(message: string) {

const prompt = `
You are SmartCare AI Intent Engine.

You NEVER answer hospital questions.

Your job is ONLY to detect:

1. intent
2. detected language
3. extracted entities

Return ONLY JSON.

Possible intents:

doctor_availability

department_location

queue_status

hospital_faq

registration

prescription_explain

general_chat

JSON:

{
  "intent":"",
  "language":"",
  "entity":"",
  "registration":{
      "name":"",
      "age":null,
      "phone":"",
      "gender":"",
      "symptoms":""
  }
}
  Entity means:

If patient asks

Where is Cardiology

entity = Cardiology

Doctor available in Dermatology

entity = Dermatology

General Medicine doctor

entity = General Medicine

Return only department/specialization name.

Patient:

${message}

`;

const response = await ai.models.generateContent({

model:"gemini-2.5-flash",

contents:prompt

});

const text=response.text??"";

const cleaned=text

.replace(/```json/g,"")

.replace(/```/g,"")

.trim();

return JSON.parse(cleaned);

}