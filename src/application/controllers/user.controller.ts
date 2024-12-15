import { Request, Response } from "express";
import loggerInstance from "../../common/utils/loggingService";
import { UserQueue } from "../../queues/userQueue";
import { InstanceService } from "../../common/utils/instance.service";

class UserController {
  private instanceService = new InstanceService();
  public async assignUser(req: Request, res: Response): Promise<any> {
    const { eventId } = req.body,
      { userId } = req["loginResponse"];

    if (!eventId) {
      loggerInstance.log("eventId is required");
      return res.status(400).json({ message: "eventId is required!" });
    }

    try {
      const assignedInstance = await UserQueue.addUserToQueue(eventId, userId);
      loggerInstance.log("User assigned successfully");
      res.json({
        message: "User assigned successfully",
        instance: assignedInstance,
      });
    } catch (error) {
      loggerInstance.error("Error assigning user:", error);
      res.status(500).json({
        message: error.message ? error.message : "Internal server error",
      });
    }
  }

  public async removeUser(req: Request, res: Response): Promise<any> {
    try {
      const { eventId } = req.body,
        { userId } = req["loginResponse"];

      if (!eventId) {
        loggerInstance.log("eventId is required");
        return res.status(400).json({ message: "eventId is required!" });
      }
      await this.instanceService.removeUserFromInstance(eventId, userId);
      res.json({ message: `User ${userId} removed from event ${eventId}` });
    } catch (error) {
      loggerInstance.error("Error removing user:", error);
      res.status(500).json({
        message: error.message ? error.message : "Internal server error",
      });
    }
  }

  public async getInstanceStats(req: Request, res: Response): Promise<any> {
    try {
      const { eventId } = req.params;
      const stats = await this.instanceService.getInstanceStats(eventId);
      res.json({ stats });
    } catch (error) {
      loggerInstance.error("Error fetching instances:", error);
      res.status(500).json({
        message: error.message ? error.message : "Internal server error",
      });
    }
  }

  public async getUserInstance(req: Request, res: Response): Promise<any> {
    try {
      const { eventId } = req.params,
        { userId } = req["loginResponse"];
      const instance = await this.instanceService.getUserInstance(
        eventId,
        userId
      );
      res.json({ instance });
    } catch (error) {
      loggerInstance.error("Error fetching instances:", error);
      res.status(500).json({
        message: error.message ? error.message : "Internal server error",
      });
    }
  }
}

export default UserController;
