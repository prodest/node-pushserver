import { IPushAssociation } from './interfaces';

export class PushAssociation implements IPushAssociation {
  id?: string;
  user: string;
  type: string;
  token: string;
  sub: string;
  subLegacy: string;

  constructor(obj: any) {
    this.user = obj.userId;
    this.type = obj.type;
    this.token = obj.token;
    this.sub = obj.sub || undefined;
    this.subLegacy = obj.subLegacy || undefined;
  }
}
