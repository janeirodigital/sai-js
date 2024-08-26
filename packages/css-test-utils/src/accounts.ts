import { host } from './config';

const password = 'password';

export type Account = {
  webId: string;
  email: string;
  shortName: string;
  password: 'password';
  registrySet?: string;
  auth: string;
  data: { [key: string]: string };
};

export const luka: Account = {
  webId: `${host}/luka/profile/card#me`,
  email: 'luka@acme.example',
  shortName: 'luka',
  password,
  registrySet: 'http://localhost:3711/luka/yo73jo',
  auth: `${host}/luka/`,
  data: {
    corvax: `${host}/corvax/`,
    zenara: `${host}/zenara/`
  }
};

export const vaporcg: Account = {
  webId: `${host}/vaporcg/profile/card#me`,
  email: 'admin@vaporcg.example',
  shortName: 'vaporcg',
  password,
  registrySet: 'http://localhost:3711/vaporcg/clqq3c',
  auth: `${host}/vaporcg/`,
  data: {
    vortiga: `${host}/vortiga/`,
    galathor: `${host}/galathor/`
  }
};

export const solid: Account = {
  webId: `${host}/solid/profile/card#me`,
  email: 'admin@solid.example',
  shortName: 'solid',
  password,
  auth: `${host}/solid/`,
  data: {
    solid: `${host}/solid/`
  }
};
