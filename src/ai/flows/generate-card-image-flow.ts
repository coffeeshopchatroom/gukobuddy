'use server';
/**
 * @fileOverview ai flow for generating images for flashcards.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCardImageInputSchema = z.object({
  prompt: z.string().describe('description of the image to generate.'),
});

const GenerateCardImageOutputSchema = z.object({
  imageUrl: z.string().describe('data uri of the generated image.'),
});

/**
 * generates an image using imagen based on a text prompt.
 */
export async function generateCardImage(input: z.infer<typeof GenerateCardImageInputSchema>): Promise<z.infer<typeof GenerateCardImageOutputSchema>> {
  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `a simple, clear educational illustration for a flashcard: ${input.prompt}. minimal style, white background, no text in the image.`,
    });

    if (!media || !media.url) {
      throw new Error('no image generated');
    }

    return { imageUrl: media.url };
  } catch (error) {
    console.error("image generation failed:", error);
    throw error;
  }
}
