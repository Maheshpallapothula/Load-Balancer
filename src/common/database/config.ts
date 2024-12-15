import mongoose from "mongoose";
import loggerInstance from "../utils/loggingService";

export const ConnectDatabase = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      await mongoose.connect(process.env.DATABASE_CONNECTION);
      resolve(true);
    } catch (error) {
      loggerInstance.error("DATABASE_CONNECTION_ERROR", { data: error });
      reject(false);
    }
  });
};
