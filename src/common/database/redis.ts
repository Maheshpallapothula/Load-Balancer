import { Redis } from "ioredis";
import loggerInstance from "../utils/loggingService";
import { get } from "../config/env.config";

let redisClient: Redis;

export const connectRedis = async () => {
  try {
    const REDIS_HOST = get("REDIS_HOST");
    const REDIS_PORT = get("REDIS_PORT");
    const REDIS_AUTHENTICATION = get("REDIS_AUTHENTICATION");
    redisClient = new Redis({
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      password: REDIS_AUTHENTICATION,
    });

    redisClient.on("error", (err: any) => {
      loggerInstance.error(
        "REDIS_ERROR",
        `Redis connection error: ${err.message}`
      );
    });

    redisClient.on("connect", () => {
      loggerInstance.log("REDIS_CONNECTED", "Connected to Redis successfully");
    });

    return redisClient;
  } catch (error) {
    loggerInstance.error("REDIS_ERROR", "Failed to connect to Redis");
    return null;
  }
};

export const getRedisClient = () => {
  return redisClient;
};
