import axios from 'axios';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Function to check if error is retryable
const isRetryableError = (error) => {
  if (!error.response) {
    // Network errors (ERR_NETWORK, ERR_CONNECTION_RESET, etc.)
    return true;
  }
  
  // Retry on 5xx server errors and 408 timeout
  const status = error.response.status;
  return status >= 500 || status === 408;
};

// Retry function - uses axios directly to avoid interceptor loops
const retryRequest = async (config, retryCount = 0) => {
  if (retryCount >= MAX_RETRIES) {
    const maxRetriesError = new Error('Max retries exceeded');
    maxRetriesError.code = 'ERR_NETWORK';
    throw maxRetriesError;
  }

  // Exponential backoff: wait longer for each retry
  const delay = RETRY_DELAY * Math.pow(2, retryCount);
  await new Promise(resolve => setTimeout(resolve, delay));

  try {
    // Use axios directly with the same config to avoid interceptor recursion
    return await axios({
      ...config,
      timeout: config.timeout || 30000,
    });
  } catch (error) {
    if (isRetryableError(error) && retryCount < MAX_RETRIES - 1) {
      return retryRequest(config, retryCount + 1);
    }
    throw error;
  }
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching issues
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is retryable and we haven't exceeded max retries
    if (isRetryableError(error) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        return await retryRequest(originalRequest);
      } catch (retryError) {
        // If retry fails, enhance error message
        if (retryError.message === 'Max retries exceeded' || retryError.code === 'ERR_NETWORK') {
          const enhancedError = new Error(
            'Network connection failed. Please check your internet connection and try again.'
          );
          enhancedError.code = error.code || 'ERR_NETWORK';
          enhancedError.originalError = error;
          throw enhancedError;
        }
        throw retryError;
      }
    }

    // For non-retryable errors or if retry already attempted
    return Promise.reject(error);
  }
);

export default axiosInstance;

