import axios from "axios";
import ErrorService from "./error.service";
import { get } from "../config/env.config";

export default class AuthEngine {
  private AUTH_ENGINE_URL: string;
  private AUTH_SECRET: string;
  private errorService: any;
  constructor() {
    this.errorService = new ErrorService();
    this.AUTH_SECRET = get("AUTH_SECRET");
    this.AUTH_ENGINE_URL = get("AUTH_ENGINE_BASE_URL");
  }
  async introspect(accessToken) {
    try {
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.AUTH_ENGINE_URL}/login/token/introspect`,
        headers: {
          Authorization: `${accessToken}`,
          "x-client-secret": this.AUTH_SECRET,
        },
      };
      const response = await axios(config);
      return response;
    } catch (error) {
      this.errorService.error({ message: error }, 401);
    }
  }
}
