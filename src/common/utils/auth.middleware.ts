import { Logger } from "winston";
import AuthEngine from "./auth.engine";
import ErrorService from "./error.service";
import RedisHelperService from "./redis.service";
import { get } from "../config/env.config";
import { MESSAGES } from "./messages";

export default class AuthMiddleware {
  private errorService: any;
  private authEngine: AuthEngine | any;
  private redisHelper: RedisHelperService | any;
  constructor() {
    this.errorService = new ErrorService();
    this.authEngine = new AuthEngine();
    this.redisHelper = new RedisHelperService();
    // Bind methods to class context
    this.authenticateToken = this.authenticateToken.bind(this);
  }

  async URLcheck(url) {
    const ExcludedUrls = [
      "/health-check",
      "/api/servers/create-server-instances",
    ];
    const hasURL = ExcludedUrls.includes(url);
    return hasURL;
  }

  async authenticateToken(req, res, next) {
    try {
      const access_token = req.headers["authorization"];
      const url = req?.originalUrl;

      if (await this.URLcheck(url)) {
        return next();
      }
      if (!access_token) {
        this.errorService.error(
          { message: MESSAGES.ERROR_MESSAGES.INVALID_ACCESS_TOKEN },
          401
        );
      }

      let response = await this.authEngine.introspect(access_token);
      const loginResponse = await this.redisHelper.getLoginResponse(
        access_token
      );
      if (!loginResponse?.isOrganizer) {
        this.errorService.error(
          { message: MESSAGES.ERROR_MESSAGES.NOT_AN_ORGANIZER },
          401
        );
      }

      if (!loginResponse) {
        throw new Error(MESSAGES.ERROR_MESSAGES.INVALID_ACCESS_TOKEN);
      }

      // const loginResponse = {
      //   userId: req.body.user, // dummy user id need to be passed here for testing.
      // };

      req["loginResponse"] = loginResponse;
      req.headers["authorization"] = access_token.substring(7);
      return next();
    } catch (error) {
      const errorCode =
        error?.response?.data?.statusCode !== undefined
          ? error?.response?.data?.statusCode
          : error?.status
          ? error.status
          : 401;
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}
