import axios from "axios";
import loggerInstance from "./loggingService";

export const checkInstanceHealth = async (
  healthCheckUrl: string
): Promise<boolean> => {
  try {
    const response = await axios.get(healthCheckUrl, { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    loggerInstance.error(
      `Health check failed for ${healthCheckUrl}:`,
      error.message
    );
    return false;
  }
};
