import express from "express";
import UserController from "../controllers/user.controller";

const router = express.Router();
const userController = new UserController();

router.post("/assign-user", userController.assignUser.bind(userController));
router.post("/remove-user", userController.removeUser.bind(userController));
router.get(
  "/user-instance/:eventId",
  userController.getUserInstance.bind(userController)
);
router.get(
  "/instance-stats/:eventId",
  userController.getInstanceStats.bind(userController)
);

export default router;
