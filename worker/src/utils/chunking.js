import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

export async function chunkText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }

  return splitter.splitText(text);
}
