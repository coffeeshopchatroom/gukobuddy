'use server';
/**
 * @fileOverview ai flow for generating flashcards from documents and notes.
 * 
 * - generateflashcardsfromfile - extracts content from a file and creates a deck.
 * - GenerateFlashcardsInput - the parameters for deck generation.
 * - GeneratedCard - the structure of an individual card.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratedCardSchema = z.object({
  question: z.string().describe('a clear, concise question or prompt.'),
  answer: z.string().describe('the accurate answer or explanation.'),
  imagePrompt: z.string().optional().describe('a short descriptive prompt for generating a supporting visual for this card.'),
});

const GenerateFlashcardsInputSchema = z.object({
  fileDataUri: z.string().describe('the file content as a data uri (image/png, image/jpeg, or application/pdf).').optional(),
  textNotes: z.string().optional().describe('raw text notes if no file is provided.'),
  deckName: z.string(),
  educationLevel: z.string().describe('e.g., "high school", "college", or a specific grade.'),
  instructions: z.string().optional().describe('specific user requests (e.g., "focus on dates", "keep it simple").'),
});

const GenerateFlashcardsOutputSchema = z.object({
  cards: z.array(GeneratedCardSchema),
  summary: z.string().describe('a brief overview of the generated deck.'),
});

export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

/**
 * generates a deck of flashcards from an uploaded file or text notes.
 */
export async function generateFlashcardsFromFile(input: z.infer<typeof GenerateFlashcardsInputSchema>): Promise<GenerateFlashcardsOutput> {
  const prompt = ai.definePrompt({
    name: 'generateFlashcardsFromFilePrompt',
    input: { schema: GenerateFlashcardsInputSchema },
    output: { schema: GenerateFlashcardsOutputSchema },
    prompt: `you are an expert study assistant. your goal is to help a student learn from their provided materials.
    
    context:
    - deck name: "{{deckName}}"
    - level: "{{educationLevel}}"
    - user instructions: "{{instructions}}"
    
    task:
    1. analyze the provided document or notes.
    2. identify the most important concepts, definitions, and facts.
    3. create 5-10 high-quality flashcards.
    4. for each card, provide a "question" and an "answer".
    5. provide an "imagePrompt" that describes a simple, clear visual that could represent the question's core concept.
    
    rules:
    - strictly lowercase: all text content must be in lowercase.
    - conciseness: keep questions and answers direct.
    - educational accuracy: ensure answers are factually correct based on the input.
    
    material:
    {{#if fileDataUri}}
    [document provided as media]
    {{media url=fileDataUri}}
    {{/if}}
    
    {{#if textNotes}}
    notes:
    {{{textNotes}}}
    {{/if}}`,
  });

  try {
    const { output } = await prompt(input);
    if (!output) throw new Error('failed to generate flashcards');
    return output;
  } catch (error: any) {
    console.error("ai flashcard generation failed:", error);
    throw error;
  }
}
