import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

const assertValidText = (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Invalid text input');
  }
};

export async function chunkText(text) {
  assertValidText(text);
  return splitter.splitText(text.trim());
}

export async function chunkTextWithMeta(text, documentId) {
  if (!documentId) {
    throw new Error('documentId is required');
  }

  const chunks = await chunkText(text);

  return chunks.map((chunk, index) => ({
    text: chunk,
    documentId,
    chunkIndex: index,
    characterCount: chunk.length,
  }));
}
