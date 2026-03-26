import httpStatus from 'http-status';
import ApiResponse from '../utils/ApiResponse.js';

export const getHealth = async (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  
  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, healthData, 'Server is healthy')
  );
};
