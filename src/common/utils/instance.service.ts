// import Redis from 'ioredis';
import { get } from "../config/env.config";
import Instance from "../database/models/instance";
import User from "../database/models/user";
import Redis from "ioredis";
import { checkInstanceHealth } from "./health-check";
import mongoose from "mongoose";

export class InstanceService {
  private redisClient = new Redis();

  public async assignUserToInstance(
    eventId: string,
    userId: string
  ): Promise<any> {
    const redisKey = `event:${eventId}:instances`;
    const pointerKey = `event:${eventId}:pointer`;

    let instances = await this.redisClient.get(redisKey);
    if (!instances) {
      const activeInstances = await Instance.find({
        eventId: new mongoose.Types.ObjectId(eventId),
        isActive: true,
      });
      instances = JSON.stringify(activeInstances);
      await this.redisClient.set(redisKey, instances);
    }

    const parsedInstances = JSON.parse(instances);

    if (!parsedInstances || !parsedInstances.length) {
      throw new Error(`No active instances available for event ${eventId}`);
    }

    // Get the round-robin pointer from Redis
    let pointer: string | number = await this.redisClient.get(pointerKey);
    pointer = pointer ? parseInt(pointer, 10) : 0;

    const maxUsersPerInstance = Number(get("MAX_USERS_PER_INSTANCE"));
    const totalInstances = parsedInstances.length;

    for (let i = 0; i < totalInstances; i++) {
      // Use the pointer to select the next instance
      const instanceIndex = (pointer + i) % totalInstances;
      const instance = parsedInstances[instanceIndex];

      // Check if the instance is healthy and has available capacity
      const isHealthy = await checkInstanceHealth(get("HEALTH_CHECK"));
      if (isHealthy && instance.assignedUsers.length < maxUsersPerInstance) {
        // Assign user to this instance
        instance.assignedUsers.push(userId);

        // Update Redis cache
        await this.redisClient.set(redisKey, JSON.stringify(parsedInstances));

        // Update the instance in MongoDB
        await Instance.updateOne(
          { link: instance.link },
          { $push: { assignedUsers: userId } }
        );

        // Create user mapping
        await User.create({
          userId,
          eventId: new mongoose.Types.ObjectId(eventId),
          instanceLink: instance.link,
        });

        // Update the pointer in Redis to point to the next instance
        await this.redisClient.set(
          pointerKey,
          (instanceIndex + 1) % totalInstances
        );

        // Return the assigned instance link
        return instance.link;
      } else if (!isHealthy) {
        // Mark unhealthy instances as inactive in both Redis and MongoDB
        instance.isActive = false;
        await this.redisClient.set(redisKey, JSON.stringify(parsedInstances));
        await Instance.updateOne({ link: instance.link }, { isActive: false });
      }
    }

    throw new Error(`No available instances for event ${eventId}`);
  }

  public async removeUserFromInstance(
    eventId: string,
    userId: string
  ): Promise<any> {
    const user = await User.findOneAndDelete({
      eventId: new mongoose.Types.ObjectId(eventId),
      userId,
    });
    if (!user) throw new Error(`User ${userId} not found in event ${eventId}`);

    await Instance.updateOne(
      { link: user.instanceLink },
      { $pull: { assignedUsers: userId } }
    );
    const redisKey = `event:${eventId}:instances`;
    // Synchronize Redis cache
    const instances = await this.redisClient.get(redisKey);
    if (instances) {
      const parsedInstances = JSON.parse(instances);

      // Find the relevant instance and remove the user
      const instanceToUpdate = parsedInstances.find(
        (instance: any) => instance.link === user.instanceLink
      );

      if (instanceToUpdate) {
        instanceToUpdate.assignedUsers = instanceToUpdate.assignedUsers.filter(
          (assignedUser: string) => assignedUser !== userId
        );

        // Update the Redis cache with the modified instance list
        await this.redisClient.set(redisKey, JSON.stringify(parsedInstances));
      }
    }
  }

  public async getUserInstance(
    eventId: string,
    userId: string
  ): Promise<string | null> {
    const user = await User.findOne({
      eventId: new mongoose.Types.ObjectId(eventId),
      userId,
    });
    return user ? user.instanceLink : null;
  }

  public async getInstanceStats(eventId: string): Promise<any[]> {
    const instances = await Instance.find({ eventId });
    return instances.map((instance) => ({
      link: instance.link,
      activeUsers: instance.assignedUsers.length,
    }));
  }
}
