import express from "express";
import ServerController from "../controllers/server.controller";

const router = express.Router();
const serverController = new ServerController();

router.post(
  "/create-server-instances",
  serverController.createServerInstances.bind(serverController)
);
export default router;
