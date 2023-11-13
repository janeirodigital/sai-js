import LinkHeader from 'http-link-header';

export function getAgentRegistrationIri(linkHeaderText: string): string | undefined {
  const links = LinkHeader.parse(linkHeaderText).refs;
  return links.find((link) => link.rel === 'http://www.w3.org/ns/solid/interop#registeredAgent')?.anchor;
}

export function getDescriptionResource(linkHeaderText: string): string | undefined {
  const links = LinkHeader.parse(linkHeaderText).refs;
  return links.find((link) => link.rel === 'describedby')?.uri;
}

export function getStorageDescription(linkHeaderText: string): string | undefined {
  const links = LinkHeader.parse(linkHeaderText).refs;
  return links.find((link) => link.rel === 'http://www.w3.org/ns/solid/terms#storageDescription')?.uri;
}

export function targetDataRegistrationLink(dataRegistrationIri: string): string {
  const link = new LinkHeader();
  link.set({
    uri: dataRegistrationIri,
    rel: 'http://www.w3.org/ns/solid/interop#targetDataRegistration'
  });
  return link.toString();
}
