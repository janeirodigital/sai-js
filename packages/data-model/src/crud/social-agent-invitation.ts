import { DataFactory } from 'n3';
import { SKOS, INTEROP } from '@janeirodigital/interop-utils';
import { CRUDContainer } from '.';
import { AuthorizationAgentFactory } from '..';

export type SocialAgentInvitationData = {
  capabilityUrl: string;
  prefLabel: string;
  note?: string;
};

export class CRUDSocialAgentInvitation extends CRUDContainer {
  data?: SocialAgentInvitationData;

  public constructor(iri: string, factory: AuthorizationAgentFactory, data?: SocialAgentInvitationData) {
    super(iri, factory, data);
  }

  // TODO: handle missing labels
  get label(): string {
    return this.getObject(SKOS.prefLabel)!.value;
  }

  get note(): string | undefined {
    return this.getObject(SKOS.note)?.value;
  }

  get capabilityUrl(): string {
    return this.getObject(INTEROP.hasCapabilityUrl)!.value;
  }

  protected datasetFromData(): void {
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.hasCapabilityUrl,
        DataFactory.literal(this.data.capabilityUrl)
      )
    );
    const props: (keyof SocialAgentInvitationData)[] = ['prefLabel', 'note'];
    for (const prop of props) {
      if (this.data[prop]) {
        this.dataset.add(
          DataFactory.quad(DataFactory.namedNode(this.iri), SKOS[prop], DataFactory.literal(this.data[prop]))
        );
      }
    }
  }

  protected async bootstrap(): Promise<void> {
    if (!this.data) {
      await this.fetchData();
    } else {
      this.datasetFromData();
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: SocialAgentInvitationData
  ): Promise<CRUDSocialAgentInvitation> {
    const instance = new CRUDSocialAgentInvitation(iri, factory, data);
    await instance.bootstrap();
    return instance;
  }
}
