import Queue, { Job } from "bull";
import { InstanceService } from "../common/utils/instance.service";
import { get } from "../common/config/env.config";
import loggerInstance from "../common/utils/loggingService";

export class UserQueue {
  private static queues: { [key: string]: Queue.Queue } = {};

  public static getQueue(eventId: string): Queue.Queue {
    if (!this.queues[eventId]) {
      const REDIS_HOST = get("REDIS_HOST");
      const REDIS_PORT = get("REDIS_PORT");
      const REDIS_AUTHENTICATION = get("REDIS_AUTHENTICATION");

      this.queues[eventId] = new Queue(`user-assignment:${eventId}`, {
        redis: {
          host: REDIS_HOST,
          port: Number(REDIS_PORT),
          password: REDIS_AUTHENTICATION,
        },
      });

      const instanceService = new InstanceService();

      this.queues[eventId].process(async (job: Job) => {
        const { userId } = job.data;
        try {
          const assignedInstance = await instanceService.assignUserToInstance(
            eventId,
            userId
          );
          return assignedInstance; // Return the assigned instance to the job
        } catch (error) {
          loggerInstance.error(
            `Failed to assign user ${userId} for event ${eventId}:`,
            error.message
          );
          throw new Error(error.message); // Ensure job is marked as failed
        }
      });
    }

    return this.queues[eventId];
  }

  public static async addUserToQueue(
    eventId: string,
    userId: string
  ): Promise<any> {
    const queue = this.getQueue(eventId);
    try {
      // Add the job to the queue
      const job = await queue.add({ userId });

      // Wait for the job to complete or fail using dynamically added listeners
      return new Promise((resolve, reject) => {
        // Define listeners
        const onCompleted = (completedJob: Job, result: any) => {
          if (completedJob.id === job.id) {
            // Remove listeners after handling the event
            queue.off("completed", onCompleted);
            queue.off("failed", onFailed);
            resolve(result); // Resolve with the assigned instance link
          }
        };

        const onFailed = (failedJob: Job, err: Error) => {
          if (failedJob.id === job.id) {
            // Remove listeners after handling the event
            queue.off("completed", onCompleted);
            queue.off("failed", onFailed);
            reject(
              new Error(err.message || "Failed to assign user to instance")
            );
          }
        };

        // Add listeners for this specific job
        queue.on("completed", onCompleted);
        queue.on("failed", onFailed);
      });
    } catch (error) {
      loggerInstance.error(
        `Failed to add user ${userId} to queue:`,
        error.message
      );
      throw new Error(`Failed to add user to queue: ${error.message}`);
    }
  }
}
