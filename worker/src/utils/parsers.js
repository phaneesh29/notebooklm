import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const normalizeText = (text) =>
  String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

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

  throw new Error(`Unsupported parser type: ${type}`);
};
