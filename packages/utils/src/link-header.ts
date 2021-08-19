import * as LinkHeader from 'http-link-header';

// TODO (elf-pavlik) make stricter by accepting clientId
export function getApplicationRegistrationIri(linkHeaderText: string): string {
  const links = LinkHeader.parse(linkHeaderText).refs;
  return links.find((link) => link.rel === 'http://www.w3.org/ns/solid/interop#registeredApplication')?.anchor;
}
