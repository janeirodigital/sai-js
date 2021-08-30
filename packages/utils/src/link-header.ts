import LinkHeader from 'http-link-header';

export function getApplicationRegistrationIri(linkHeaderText: string): string {
  const links = LinkHeader.parse(linkHeaderText).refs;
  return links.find((link) => link.rel === 'http://www.w3.org/ns/solid/interop#registeredApplication')?.anchor;
}

export function targetDataRegistrationLink(dataRegistrationIri: string): string {
  const link = new LinkHeader();
  link.set({
    uri: dataRegistrationIri,
    rel: 'http://www.w3.org/ns/solid/interop#targetDataRegistration'
  });
  return link.toString();
}
