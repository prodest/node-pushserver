import * as admin from 'firebase-admin';
import { AppConfig } from '../config';
import { pushAssociationRepository } from '../repository';

 class FirebaseService {
  public repository = pushAssociationRepository;

  constructor() {
    console.log('initializeApp Firebase');
    admin.initializeApp({
      credential: admin.credential.cert(AppConfig.firebaseServiceAccount),
      databaseURL: AppConfig.firebaseDatabaseUrl
    });
  }

  public push(registrationTokens: string[], payload: admin.messaging.MessagingPayload, ttl: number = 2419200) {
    payload = this.parsePayload(payload);

    console.log('androidPayload parsed:');
    console.log(JSON.stringify(payload));

    admin
      .messaging()
      .sendToDevice(registrationTokens, payload, { priority: 'high', timeToLive: ttl })
      .then((response: any) => {
        // See the MessagingDevicesResponse reference documentation for
        // the contents of response.
        console.log('Successfully sent fcm message:');
        console.log(JSON.stringify(response));
        return this.handleResults(registrationTokens, response.results);
      })
      .catch((error: any) => {
        console.log('Error sending firebase message:', error);
      });
  }

  private async handleResults(registrationTokens: string[], results: any) {
    let idsToUpdate: any[] = [];
    let tokensToDelete: any[] = [];

    results.forEach((result: any, index: number) => {
      if (result.canonicalRegistrationToken) {
        // TODO: verificar como é feito isso no firebase
        idsToUpdate.push({ from: registrationTokens[index], to: result.canonicalRegistrationToken });
      } else if (result.error) {
        // TODO: Verificar se é necessário tratar outras mensagens de erro
        if (
          result.error.code === 'messaging/registration-token-not-registered' ||
          result.error.code === 'messaging/invalid-registration-token' ||
          result.error.code === 'messaging/mismatched-credential'
        ) {
          tokensToDelete.push(registrationTokens[index]);
        }
      }
    });

    if (idsToUpdate.length > 0) {
      await this.repository.updateTokens(idsToUpdate);
    }
    if (tokensToDelete.length > 0) {
      await this.repository.removeTokens(tokensToDelete);
    }
  }

  private parsePayload(payload: admin.messaging.MessagingPayload): admin.messaging.MessagingPayload {
    if (payload.data) {
      payload.data = this.stringfyProperties(payload.data);
    }
    if (payload.notification) {
      payload.notification = this.stringfyProperties(payload.notification);
    }
    return payload;
  }

  private stringfyProperties(obj: any): any {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] !== 'string') {
        obj[key] = JSON.stringify(obj[key]);
      }
    });
    return obj;
  }
}

export const firebaseService = new FirebaseService();