import Redis from "ioredis";
import { getRedisClient } from "../database/redis";
import loggerInstance from "./loggingService";
export default class RedisHelperService {
  constructor() {}
  setToRedis = async (
    key: string,
    value: any,
    expiry?: number
  ): Promise<void> => {
    try {
      const redisClient:Redis = getRedisClient();
      if (!redisClient) throw new Error("Redis client not initialized");
  
      if (expiry) {
        await redisClient.set(key, value, "EX", expiry);
      } else {
        await redisClient.set(key, value);
      }
  
      loggerInstance.log("REDIS_SET", `Key "${key}" set successfully`);
    } catch (error) {
      loggerInstance.log(
        "REDIS_SET_ERROR",
        `Failed to set key "${key}": ${error.message}`
      );
    }
  };
  
  getFromRedis = async (key: string) => {
    try {
      const redisClient = getRedisClient();
      if (!redisClient) throw new Error("Redis client not initialized");
  
      const value = await redisClient.get(key);
  
      return value;
    } catch (error) {
      loggerInstance.log(
        "REDIS_GET_ERROR",
        `Failed to get key "${key}": ${error.message}`
      );
    }
  };

  deleteFromRedis = async (key: string) => {
    try {
      const redisClient = getRedisClient();
      if (!redisClient) throw new Error("Redis client not initialized");
  
      await redisClient.del(key);
      loggerInstance.log("REDIS_DELETE", `Key "${key}" deleted successfully`);
    } catch (error) {
      loggerInstance.log(
        "REDIS_DELETE_ERROR",
        `Failed to delete key "${key}": ${error.message}`
      );
    }
  };

  existsInRedis = async (key: string) => {
    try {
      const redisClient = getRedisClient();
      if (!redisClient) throw new Error("Redis client not initialized");
  
      const exists = await redisClient.exists(key);
      return exists > 0;
    } catch (error) {
      loggerInstance.log(
        "REDIS_EXISTS_ERROR",
        `Failed to check existence of key "${key}": ${error.message}`
      );
    }
  };

  getKeysFromRedis = async (pattern: string) => {
    try {
      const redisClient = getRedisClient();
      if (!redisClient) throw new Error("Redis client not initialized");
  
      const keys = await redisClient.keys(pattern);
      return keys;
    } catch (error) {
      loggerInstance.log(
        "REDIS_GET_KEY_ERROR",
        `Failed to get keys matching pattern "${pattern}": ${error.message}`
      );
    }
  };
}