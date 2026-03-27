const fileTypeByExtension = {
  '.pdf': {
    type: 'pdf',
    mimeTypes: ['application/pdf'],
  },
  '.docx': {
    type: 'docx',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  '.txt': {
    type: 'txt',
    mimeTypes: ['text/plain'],
  },
};

export const getSupportedFileType = (extension) => fileTypeByExtension[extension.toLowerCase()] || null;
