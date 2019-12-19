import * as apn from "apn";
import { Notification, Provider, ProviderOptions } from "apn";
import { AppConfig } from "../config";
import { pushAssociationRepository } from "../repository";

export class APNSService {
  public repository = pushAssociationRepository;

  private apnProvider: Provider;

  constructor() {
    const options: ProviderOptions = {
      token: {
        key: AppConfig.keyPath,
        keyId: AppConfig.keyId,
        teamId: AppConfig.appleTeamId
      },
      production: AppConfig.apnProduction
    };

    this.apnProvider = new apn.Provider(options);
  }

  public push(registrationTokens: string[], payload: any, ttl: number = 3600) {
    let note: Notification = new apn.Notification(payload);

    note.expiry = Math.floor(Date.now() / 1000) + ttl;
    note.topic = AppConfig.appleBundleId;
    note.payload = payload.data;

    this.apnProvider
      .send(note, registrationTokens)
      .then((response: any) => {
        console.log("Successfully sent apns message:");
        console.log(JSON.stringify(response));
        return this.handleResults(response.failed);
      })
      .catch((error: any) => {
        console.log("Error sending apns message:", error);
      });
  }

  private async handleResults(failedTokens: any) {
    let tokensToDelete: any[] = [];

    failedTokens.forEach((result: any) => {
      if (result.response.reason === "BadDeviceToken") {
        // TODO: Verificar se é necessário tratar outras mensagens de erro
        tokensToDelete.push(result.device);
      }
    });

    if (tokensToDelete.length > 0) {
      await this.repository.removeTokens(tokensToDelete);
    }
  }
}

// const apnsService = new APNSService();
new APNSService();
