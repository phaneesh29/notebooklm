import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { fetchTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';
import { normalizeText } from './text-cleaning.js';

export const parseTxtBuffer = (buffer) => normalizeText(buffer.toString('utf8'));

export const parsePdfBuffer = async (buffer) => {
  const parsed = await pdfParse(buffer);
  return normalizeText(parsed.text);
};

export const parseDocxBuffer = async (buffer) => {
  const parsed = await mammoth.extractRawText({ buffer });
  return normalizeText(parsed.value);
};

export const parseWebUrl = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'NotebookLM-Worker/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $('script, style, noscript').remove();

  const title = $('title').first().text().trim();
  const bodyText = $('body').text();

  return {
    title: title || null,
    text: normalizeText(bodyText),
  };
};

export const parseYoutubeUrl = async (url) => {
  const transcriptItems = await fetchTranscript(url);
  const text = normalizeText(transcriptItems.map((item) => item.text).join(' '));

  let title = null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      title = data.title || null;
    }
  } catch {
    title = null;
  }

  return {
    title,
    text,
    transcript: transcriptItems,
  };
};

export const parseDocumentByType = async ({ type, buffer, url }) => {
  if (type === 'txt') {
    return {
      text: parseTxtBuffer(buffer),
    };
  }

  if (type === 'pdf') {
    return {
      text: await parsePdfBuffer(buffer),
    };
  }

  if (type === 'docx') {
    return {
      text: await parseDocxBuffer(buffer),
    };
  }

  if (type === 'web') {
    return parseWebUrl(url);
  }

  if (type === 'youtube') {
    return parseYoutubeUrl(url);
  }

  throw new Error(`Unsupported parser type: ${type}`);
};
