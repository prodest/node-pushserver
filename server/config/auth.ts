import { Request, Response, NextFunction } from 'express';
import * as jwt from 'express-jwt';
import * as jwksRsa from 'jwks-rsa';

class AuthClass {
  constructor() {}

  private readonly jwksUri = process.env.AUTH_JWKS_URI || 'https://acessocidadao.es.gov.br/is/.well-known/jwks';
  private readonly audience = process.env.AUTH_AUDIENCE || 'https://acessocidadao.es.gov.br/is/resources';
  private readonly issuer = process.env.AUTH_ISSUER || 'https://acessocidadao.es.gov.br/is';
  private readonly algorithm = process.env.AUTH_ALGORITHM || 'RS256';

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
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.user.sub) {
        const error: any = new Error('App Token sendo utilizado ao invés de user token.');
        error.status = 401; // Unauthorized
        throw error;
      }

      return next();
    }
  ];
}

export const Auth = new AuthClass();
