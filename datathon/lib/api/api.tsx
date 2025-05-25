import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', // Adjust this to your ML model endpoint
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interface for ML model prediction request
interface MLPredictionRequest {
  data: any; // Replace 'any' with your specific data type
}

// Interface for ML model prediction response
interface MLPredictionResponse {
  prediction: any; // Replace 'any' with your specific response type
  confidence?: number;
}

// API facade class
class ApiFacade {
  // Method to send data to ML model
  async predictMLModel(data: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      const response = await api.post<MLPredictionResponse>('/predict', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`ML Model API Error: ${error.message}`);
      }
      throw error;
    }
  }
}

// Export a singleton instance
export const apiFacade = new ApiFacade();
