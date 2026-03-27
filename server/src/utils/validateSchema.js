import httpStatus from 'http-status';
import ApiError from './ApiError.js';

const formatZodIssues = (issues) => {
  return issues.map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : 'request';
      return `${path}: ${issue.message}`;
    }).join(', ');
};

export const validateWithSchema = (schema, input) => {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      formatZodIssues(result.error.issues) || 'Invalid request data'
    );
  }

  return result.data;
};

