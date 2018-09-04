/**
 * This class have all application config
 */
export class AppConfig {
  public static get requestPath(): string {
    return this.getEnv('REQUEST_PATH') || '/';
  }

  public static get mongoDBUrl(): string {
    return this.getEnv('MONGODB_URL') || 'mongodb://algumacoisa:1234';
  }

  public static get publicKey(): string {
    return this.getEnv('PUBLIC_KEY') || 'publicKey';
  }

  public static get username(): string {
    return this.getEnv('USERNAME') || 'prodest';
  }

  public static get password(): string {
    return this.getEnv('PASSWORD') || 'secret';
  }

  public static get appleTeamId(): string {
    return this.getEnv('APPLE_DEVELOPER_TEAM_ID') || 'apple_developer_team_id';
  }

  public static get keyPath(): string {
    return this.getEnv('APPLE_KEY_PATH') || 'apple_key_path';
  }

  public static get keyId(): string {
    return this.getEnv('APPLE_KEY_ID') || 'apple_key_id';
  }

  public static get appleBundleId(): string {
    return this.getEnv('APPLE_BUNDLE_ID') || 'appleBundleId';
  }

  public static get apnProduction(): boolean {
    return this.getEnv('APN_PRODUCTION') === 'true';
  }

  public static get firebaseServiceAccount(): any {
    const firebaseData = this.getEnv('FIREBASE_SERVICE_ACCOUNT');
    return firebaseData
      ? JSON.parse(firebaseData)
      : {
          type: 'service_account',
          project_id: this.getEnv('PROJECT_ID') || '',
          private_key_id: this.getEnv('PRIVATE_KEY_ID') || '',
          private_key: this.getEnv('PRIVATE_KEY') || '',
          client_email: this.getEnv('CLIENT_EMAIL') || '',
          client_id: this.getEnv('CLIENT_ID') || '',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://accounts.google.com/o/oauth2/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: this.getEnv('CLIENT_X509_CERT_URL') || ''
        };
  }

  public static get firebaseDatabaseUrl(): string {
    return this.getEnv('FIREBASE_DATABASE_URL') || 'https://espm-35b8a.firebaseio.com';
  }

  private static getEnv(key: string): string {
    if (!process.env[key]) {
      console.warn(`a variável ${key} não foi definida`);
      return undefined;
    } else {
      return process.env[key];
    }
  }
}
