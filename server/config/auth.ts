import { Request, Response, NextFunction } from "express";
import * as jwt from "express-jwt";
import * as jwksRsa from "jwks-rsa";
import * as rp from "request-promise";

class AuthClass {
  private readonly jwksUri =
    process.env.AUTH_JWKS_URI ||
    "https://acessocidadao.es.gov.br/is/.well-known/jwks";
  private readonly audience =
    process.env.AUTH_AUDIENCE || "https://acessocidadao.es.gov.br/is/resources";
  private readonly issuer =
    process.env.AUTH_ISSUER || "https://acessocidadao.es.gov.br/is";
  private readonly algorithm = process.env.AUTH_ALGORITHM || "RS256";

  constructor() {}

  getUserInfo = (req: Request, res: Response, next: NextFunction) => {
    // POST pra userinfo endpoint e incrementar o objeto user
    rp({
      uri: `${this.issuer}/connect/userinfo`,
      headers: {
        Authorization: req.headers.authorization
      },
      json: true
    }).then((userInfo: any) => {
      req.user.subNovo = userInfo.subNovo;
      return next();
    });
  };

  checkUserToken = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && !req.user.sub) {
      const error: any = new Error(
        "App Token sendo utilizado ao invés de user token."
      );
      error.status = 401; // Unauthorized
      throw error;
    }

    return next();
  };

  middleware = [
    jwt({
      // Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
      secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: this.jwksUri
      }),

      // Validate the audience and the issuer.
      audience: this.audience,
      issuer: this.issuer,
      algorithms: [this.algorithm],
      credentialsRequired: false
    }),
    this.checkUserToken,
    this.getUserInfo
  ];
}

export const Auth = new AuthClass();
