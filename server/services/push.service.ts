import * as _ from 'lodash';
import { pushAssociationRepository } from '../repository';
import { IPushAssociation } from '../models';
import { firebaseService, apnsService } from '../services';

export class PushService {
  private repository = pushAssociationRepository;
  private firebaseService = firebaseService;
  private apnsService = apnsService;

  // Helpers
  public sendNotifications(notifs: any) {
    let areNotificationsValid = _(notifs)
      .map(this.validateNotification)
      .min();

    if (!areNotificationsValid) {
      throw 'Payload inválido';
    }

    notifs.forEach((notif: any) => {
      const users = notif.users;
      const sendToAll = notif.sendToAll;
      const androidPayload = notif.android;
      const iosPayload = notif.ios;
      const ttl: number = notif.ttl;

      if (!users && !sendToAll) {
        throw 'Nenhum usuário de destino';
      }

      if (users) {
        this.repository
          .getForIds(users)
          .then((pushAssociations: any) => this.send(pushAssociations, androidPayload, iosPayload, ttl))
          .catch(console.error);
      } else {
        this.repository
          .getAll()
          .then((pushAssociations: any) => this.send(pushAssociations, androidPayload, iosPayload, ttl))
          .catch(console.error);
      }
    });

    return true;
  }

  public send(
    pushAssociations: IPushAssociation[],
    androidPayload: any = undefined,
    iosPayload: any = undefined,
    ttl: number
  ) {
    const fcmTokens = pushAssociations
      .filter(pa => pa.type.toLowerCase() === 'android' || pa.type.toLowerCase() === 'web')
      .map(pa => pa.token);
    const apnsTokens = pushAssociations.filter(pa => pa.type.toLowerCase() === 'ios').map(pa => pa.token);

    console.log('androidPayload parsed:');
    console.log(JSON.stringify(androidPayload));

    if (androidPayload && fcmTokens.length > 0) {
      this.firebaseService.push(fcmTokens, androidPayload, ttl);
    }

    if (iosPayload && apnsTokens.length > 0) {
      this.apnsService.push(apnsTokens, iosPayload, ttl);
    }
  }

  public validateNotification(notif: any) {
    let valid = true && (!!notif.ios || !!notif.android);
    // TODO: validate content

    return valid;
  }

  public createPushObject(
    users: string[],
    title: string,
    message: string,
    state: string,
    stateParams: any,
    icon: string
  ) {
    if (!icon) {
      icon = 'notification';
    }

    return {
      users: users,
      android: {
        collapseKey: 'optional',
        data: {
          icon: icon,
          message: message,
          appData: {
            state: state,
            params: stateParams
          }
        }
      },
      ios: {
        notification: {
          badge: 0,
          title: title,
          body: message,
          sound: 'default',
          icon: icon
        },
        data: {
          appData: {
            state: state,
            params: stateParams
          }
        },
        priority: 'high'
      }
    };
  }
}
