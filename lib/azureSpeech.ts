import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export async function speakAzure(
  text: string,
  language = "en"
) {

  return new Promise<Buffer>((resolve, reject) => {

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );

    // Language
    switch (language) {

  case "hi-IN":
    speechConfig.speechSynthesisVoiceName = "hi-IN-SwaraNeural";
    break;

  case "gu-IN":
    speechConfig.speechSynthesisVoiceName = "gu-IN-DhwaniNeural";
    break;

  case "mr-IN":
    speechConfig.speechSynthesisVoiceName = "mr-IN-AarohiNeural";
    break;

  case "ta-IN":
    speechConfig.speechSynthesisVoiceName = "ta-IN-PallaviNeural";
    break;

  case "te-IN":
    speechConfig.speechSynthesisVoiceName = "te-IN-ShrutiNeural";
    break;

  default:
    speechConfig.speechSynthesisVoiceName = "en-IN-NeerjaNeural";
}
    const synthesizer =
      new sdk.SpeechSynthesizer(speechConfig);

    synthesizer.speakTextAsync(

      text,

      result => {

        synthesizer.close();

        resolve(Buffer.from(result.audioData));

      },

      err => {

        synthesizer.close();

        reject(err);

      }

    );

  });

}