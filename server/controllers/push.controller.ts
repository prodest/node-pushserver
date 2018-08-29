import { Request, Response } from 'express';
import { pushAssociationRepository } from '../repository';
import { PushService } from '../services';

export class PushController {
  private repository = pushAssociationRepository;
  private pushService: PushService;

  constructor() {
    this.pushService = new PushService();
  }

  public async index(req: Request, res: Response): Promise<any> {
    return res.render('./index');
  }

  public getUsers(req: Request, res: Response) {
    return this.repository.getDistinctUsersById().then((ids: any[]) => ({ users: ids }));
  }

  public getFullUsers(req: Request, res: Response) {
    return this.repository.getAll();
  }

  public getUserAssociations(req: Request, res: Response) {
    return this.repository.getForId(req.params.sub).then((associations: any[]) => ({ associations: associations }));
  }

  public send(req: Request, res: Response) {
    let notifs = [req.body];
    let notificationsValid = this.pushService.sendNotifications(notifs);
    res.status(notificationsValid ? 200 : 400).send();
  }

  public sendAndroidIos(req: Request, res: Response) {
    const pushData = [this.createPushObject(req.body)];

    const notificationsValid = this.pushService.sendNotifications(pushData);

    res.status(notificationsValid ? 200 : 400).send();
  }

  public subscribe(req: any, res: Response) {
    const association = {
      sub: req.user ? req.user.sub : null,
      type: req.body.type,
      token: req.body.token,
      user: req.body.user
    };

    return this.repository.update(association);
  }

  public unsubscribe(req: any, res: Response) {
    const deviceInfo = req.body;

    return this.repository.removeUUID(deviceInfo.user);
  }

  public delete(req: Request, res: Response) {
    return this.repository.removeUser(req.params.user);
  }

  private createPushObject(body: any) {
    let { users, title, message, state, stateParams, icon } = body;

    if (!icon) {
      icon = 'notification';
    }

    return {
      users: users,
      android: {
        data: {
          'content-available': 1,
          'no-cache': 1,
          icon: icon,
          title: title,
          message: message,
          appData: {
            state: state,
            params: stateParams
          }
        }
      },
      ios: {
        badge: 0,
        sound: 'default',
        alert: {
          title: title,
          body: message
        },
        data: {
          appData: {
            state: state,
            params: stateParams
          }
        }
      }
    };
  }
}
