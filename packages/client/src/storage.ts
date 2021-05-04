import { ApplicationProfile } from './client';


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


    private applicationProfile: ApplicationProfile;
    private registrySets: RegistrySet;


    private constructor() {}

    public static getInstance(): Storage {
        if (!Storage.instance) {
            Storage.instance = new Storage();
        }
        return Storage.instance;
    }

    public setApplicationProfile(profile: ApplicationProfile): void {
        this.applicationProfile = profile;
    }

    public setRegistrySets(sets: RegistrySet): void {
        this.registrySets = sets;
    }
}
