import * as auth from 'basic-auth';
import * as jwt from 'jwt-simple';
import { NextFunction, Request, Response } from 'express';
import { AppConfig } from '../config';

export class AuthenticationService {
  public static decodeToken(req: any, res: Response, next: NextFunction) {
    try {
      let authorization = req.get('Authorization');

      console.log(authorization);

      if (authorization && authorization.length > 7) {
        let token = authorization.slice(7);
        let decodedToken = jwt.decode(token, AppConfig.publicKey);

        if (!decodedToken.error) {
          req.decodedToken = decodedToken;
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      next();
    }
  }

  // Simple route middleware to ensure user is authenticated.
  // Use this route middleware on any resource that needs to be protected.  If
  // the request is authenticated (typically via a persistent login session),
  // the request will proceed.  Otherwise, the user will be redirected to the
  // login page.
  public static basicAuthentication(req: Request, res: Response, next: NextFunction) {
    let credentials = auth(req);

    if (!credentials || AppConfig.username !== credentials.name || AppConfig.password !== credentials.pass) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm="example"');
      res.end('Access denied');
    } else {
      return next();
    }
  }
}
