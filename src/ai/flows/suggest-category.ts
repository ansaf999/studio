// src/ai/flows/suggest-category.ts
'use server';

/**
 * @fileOverview Suggests a category for a ledger entry based on the description.
 *
 * - suggestCategory - A function that suggests a category for a ledger entry.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestCategoryInputSchema = z.object({
  description: z.string().describe('The description of the ledger entry.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the ledger entry.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {
    schema: z.object({
      description: z.string().describe('The description of the ledger entry.'),
    }),
  },
  output: {
    schema: z.object({
      category: z.string().describe('The suggested category for the ledger entry.'),
    }),
  },
  prompt: `You are an expert financial assistant. Based on the description of a ledger entry, suggest the most appropriate category.

Description: {{{description}}}

Suggest a category:`,
});

const suggestCategoryFlow = ai.defineFlow<
  typeof SuggestCategoryInputSchema,
  typeof SuggestCategoryOutputSchema
>({
  name: 'suggestCategoryFlow',
  inputSchema: SuggestCategoryInputSchema,
  outputSchema: SuggestCategoryOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
