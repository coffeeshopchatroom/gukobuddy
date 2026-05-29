import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// THIS IS A TEMPORARY DEBUGGING STEP. DO NOT LEAVE THE KEY HERE.
const hardcodedApiKey = 'AIzaSyCggdPmkfXzpgoev2miHfEPrJRYWhFkJMc';

export const ai = genkit({
  plugins: [googleAI({apiKey: hardcodedApiKey})],
  model: 'googleai/gemini-2.5-flash',
});
