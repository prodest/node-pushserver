import * as express from 'express';
import { Application, Router } from 'express';
import { AppConfig } from '../config';
import { PingRouter } from './ping.router';
import { PushRouter } from './push.router';

export namespace main {
  export const callRoutes = (app: Application): Application => {
    const router: Router = Router();

    router.use('/api/v1/ping', new PingRouter().getRouter());
    router.use('/api/v1/', express.static(__dirname + '/../../public'));
    router.use('/api/v1/', new PushRouter().getRouter());
    router.use('/', new PushRouter().getRouter());
    router.use('/', express.static(__dirname + '/../../public'));

    app.use(AppConfig.requestPath, router);
    return app;
  };
}
