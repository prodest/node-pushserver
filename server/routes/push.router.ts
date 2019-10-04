import { Request, Response, Router, NextFunction } from 'express';
import { PushController } from '../controllers';
import { AuthenticationService } from '../services';
import * as Bluebird from 'bluebird';
import { Auth } from '../config';

export class PushRouter {
    private router: Router;
    private controller: PushController;

    constructor() {
        this.controller = new PushController();
        this.router = Router();
        this.routers();
    }

    private respond(promise: any | Bluebird<any>, res: Response, next: NextFunction) {
        promise
            .then((data: any) => {
                res.json(data)
            })
            .catch((error: any) => {
                next(error)
            });
    }

    public routers() {

        // Main API
        this.router.post('/subscribe', Auth.middleware, (req: Request, res: Response, next: NextFunction) => this.respond(this.controller.subscribe(req, res), res, next));
        this.router.post('/unsubscribe', (req: Request, res: Response) => this.controller.unsubscribe(req, res));
        this.router.post('/send', AuthenticationService.basicAuthentication, (req: Request, res: Response) => this.controller.send(req, res));
        this.router.post('/send-android-ios', AuthenticationService.basicAuthentication, (req: Request, res: Response) => this.controller.sendAndroidIos(req, res));

        // Utils API
        this.router.get('/users/:sub/associations', AuthenticationService.basicAuthentication, (req: Request, res: Response, next: NextFunction) => this.respond(this.controller.getUserAssociations(req, res), res, next));
        this.router.get('/users', AuthenticationService.basicAuthentication, (req: Request, res: Response, next: NextFunction) => this.respond(this.controller.getUsers(req, res), res, next));
        this.router.get('/fullUsers', AuthenticationService.basicAuthentication, (req: Request, res: Response, next: NextFunction) => this.respond(this.controller.getFullUsers(req, res), res, next));
        this.router.delete('/users/:sub', AuthenticationService.basicAuthentication, (req: Request, res: Response, next: NextFunction) => this.respond(this.controller.delete(req, res), res, next));
        this.router.get('/', AuthenticationService.basicAuthentication, (req: Request, res: Response, next: NextFunction) => this.respond(this.controller.index(req, res), res, next));
        this.router.post('/*', AuthenticationService.basicAuthentication, (req: Request, res: Response, next: NextFunction) => req.is('application/json') ? next() : res.status(406).send());
    }

    public getRouter(): Router {
        return this.router;
    }
}
