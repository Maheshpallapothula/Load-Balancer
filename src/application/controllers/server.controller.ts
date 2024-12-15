import { Request, Response } from "express";
import loggerInstance from "../../common/utils/loggingService";
import { get } from "../../common/config/env.config";
import mongoose from "mongoose";
import { MESSAGES } from "../../common/utils/messages";
import { newCreateCloudFormationDeploy } from "../../common/utils/create.instance";
import Redis from "ioredis";
import Instance from "../../common/database/models/instance";

class ServerController {
  private redisClient = new Redis();

  public async storeServerInstances(eventId: any, instanceLinks: string[]) {
    try {
      const redisKey = `event:${eventId}:instances`;
      const pointerKey = `event:${eventId}:pointer`; // Pointer key for round-robin

      // Prepare instance data
      const instanceData = instanceLinks.map((link) => ({
        link,
        eventId: new mongoose.Types.ObjectId(eventId),
        isActive: true,
        assignedUsers: [],
      }));

      // Store instances in Redis
      await this.redisClient.set(redisKey, JSON.stringify(instanceData));

      // Initialize the pointer for round-robin
      await this.redisClient.set(pointerKey, 0); // Start pointer at the first instance

      // Store instances in MongoDB
      await Instance.insertMany(instanceData);

      loggerInstance.log("Server instances stored successfully");
    } catch (error) {
      loggerInstance.error("Error storing server instances:", error);
      throw new Error("Unable to store server instances");
    }
  }

  public createServerInstances = async (req: Request, res: Response) => {
    const { users, password, eventId } = req.body;

    // Validate that users is a number
    if (typeof users !== "number" || isNaN(users) || users <= 0) {
      loggerInstance.log("Invalid 'users' value:", users);
      return res
        .status(400)
        .json({ message: MESSAGES.ERROR_MESSAGES.USERS_MUST_BE_A_NUMBER });
    }

    // Retrieve configuration values
    const maxUsersPerInstance = Number(get("MAX_USERS_PER_INSTANCE"));
    const additionalServers = Number(get("ADDITIONAL_SERVERS"));

    // Validate retrieved configuration values
    if (isNaN(maxUsersPerInstance) || maxUsersPerInstance <= 0) {
      loggerInstance.log(
        MESSAGES.LOGG_MESSAGES.INVALID_MAX_USERS,
        maxUsersPerInstance
      );
      return res.status(500).json({
        message:
          MESSAGES.ERROR_MESSAGES.INVALID_SERVER_CONFIGURATION(
            "INVALID_MAX_USERS"
          ),
      });
    }

    if (isNaN(additionalServers) || additionalServers < 0) {
      loggerInstance.log(
        "Invalid 'ADDITIONAL_SERVERS' configuration value:",
        additionalServers
      );
      return res.status(500).json({
        message:
          MESSAGES.ERROR_MESSAGES.INVALID_SERVER_CONFIGURATION(
            "ADDITIONAL_SERVERS"
          ),
      });
    }

    // Calculate the number of servers needed
    const numberOfInstances =
      Math.ceil(users / maxUsersPerInstance) + additionalServers;
    loggerInstance.log(
      MESSAGES.LOGG_MESSAGES.CREATING_INSTANCES,
      numberOfInstances
    );

    if (!numberOfInstances || numberOfInstances <= 0) {
      return res
        .status(400)
        .json({ message: MESSAGES.ERROR_MESSAGES.INSTANCES_GT });
    }

    if (!eventId) {
      return res
        .status(400)
        .json({ message: MESSAGES.ERROR_MESSAGES.EVENTID_REQUIRED });
    }

    if (password !== get("ADMIN_PASSWORD")) {
      return res
        .status(401)
        .json({ message: MESSAGES.ERROR_MESSAGES.INCRCT_PSWRD });
    }

    try {
      let serverLinks = [];
      for (let i = 0; i < 1; i++) {
        const serverLink = await newCreateCloudFormationDeploy("", "");
        `https://dev-mai-int-qa-instance-instanceId${i}`; //Dummy Instance link.
        serverLinks.push(serverLink);
      }

      await this.storeServerInstances(eventId, serverLinks);
      res.json({
        message: MESSAGES.SUCCESS_MESSAGES.SERVER_INSTANCES_CREATED,
        serverLinks,
      });
    } catch (error) {
      loggerInstance.error("Error creating server instances:", error);
      res.status(500).json({
        message: error.message ? error.message : "Internal server error",
      });
    }
  };
}

export default ServerController;
