// TODO should this include inbox, accessInbox, receivesAccessReceipt
export type RegistrySet = {
    application: string,
    data: string,
    accessGrant: string,
    accessReceipt: string,
    remoteData: string,
}

export class Storage {
    private static instance: Storage;

    private registrySets: RegistrySet;

    public static getInstance(): Storage {
      if (!Storage.instance) {
        Storage.instance = new Storage();
      }
      return Storage.instance;
    }

    public setRegistrySets(sets: RegistrySet): void {
      this.registrySets = sets;
    }
}
