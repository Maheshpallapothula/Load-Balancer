import "dotenv/config";
import express, { application, Application } from "express";
import cors from "cors";
import { MainRoutes } from "./routes";
import bodyParser from "body-parser";
import AuthMiddleware from "../../src/common/utils/auth.middleware"
class App {
  public app: express.Application;
  private authMiddleware: any

  constructor() {
    this.authMiddleware = new AuthMiddleware();
    this.app = express();
    this.initializeServer();
    this.intializeMiddleware();
    this.initializeRoutes();
  }

  private intializeMiddleware() {
    this.app.use(this.authMiddleware.authenticateToken)
  }

  private initializeServer(): void {
    this.app.use(bodyParser.json({ limit: "10gb" }));
    this.app.use(bodyParser.urlencoded({ limit: "10gb", extended: true }));
    const allowedOrigins = ["*"];

    const options: cors.CorsOptions = {
      origin: "*",
    };

    this.app.use(cors(options));
  }

  private initializeRoutes(): void {
    const routes = new MainRoutes();
    routes.initialize(this.app);
  }
}

export default new App().app;
