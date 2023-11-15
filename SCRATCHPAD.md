# High Level Functionality - User Story

1. User is on a note. 
2. They run command `:Audio Alchemy`
3. The contents of the note are taken in by the plugin and converted to audio based on user settings.
    a. If set to podcast mode, the audio is converted to a podcast using GPT
    b. If on classic mode, will text as it is and send it off to TTS.
4. At the same time, the prompt is converted to an image prompt, and then that prompt is sent to DALL-E to generate an image.
4. The resulting audio is saved to the note as an mp3 and the image from the image prompt.
5. If using the `audio-player` or `banner` plugins, enrich with the resulting audio file.


```js
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI();

const speechFile = path.resolve("./speech.mp3");

async function main() {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: "Today is a wonderful day to build something people love!",
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
main();
```