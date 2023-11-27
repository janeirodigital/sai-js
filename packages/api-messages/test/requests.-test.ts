// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import {
  AddSocialAgentRequest,
  ApplicationAuthorizationRequest,
  ApplicationsRequest,
  UnregisteredApplicationProfileRequest,
  DataRegistriesRequest,
  DescriptionsRequest,
  RequestMessageTypes,
  ResourceRequest,
  ShareAuthorizationRequest,
  SocialAgentsRequest,
  ListDataInstancesRequest,
  AgentType
} from '../src/index';

describe('Request has proper message type', () => {
  test('ApplicationsRequest', () => {
    const request = new ApplicationsRequest();
    const expected = {
      type: RequestMessageTypes.APPLICATIONS_REQUEST
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('UnregisteredApplicationProfileRequest', () => {
    const id = 'https://projectron.example';
    const request = new UnregisteredApplicationProfileRequest(id);
    const expected = {
      type: RequestMessageTypes.UNREGISTERED_APPLICATION_PROFILE,
      id
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('SocialAgentsRequest', () => {
    const request = new SocialAgentsRequest();
    const expected = {
      type: RequestMessageTypes.SOCIAL_AGENTS_REQUEST
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('AddSocialAgentRequest', () => {
    const webId = 'https://bob.example';
    const label = 'bob';
    const note = 'bob note';
    const request = new AddSocialAgentRequest(webId, label, note);
    const expected = {
      type: RequestMessageTypes.ADD_SOCIAL_AGENT_REQUEST,
      webId,
      label,
      note
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('DataRegistriesRequest', () => {
    const lang = 'en';
    const agentId = 'https://bob.example';

    const request = new DataRegistriesRequest(agentId, lang);
    const expected = {
      type: RequestMessageTypes.DATA_REGISTRIES_REQUEST,
      agentId,
      lang
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('DescriptionsRequest', () => {
    const lang = 'en';
    const agentId = 'http://app.example';
    const request = new DescriptionsRequest(agentId, AgentType.Application, lang);
    const expected = {
      type: RequestMessageTypes.DESCRIPTIONS_REQUEST,
      agentId,
      agentType: AgentType.Application,
      lang
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('ListDataInstancesRequest', () => {
    const registrationId = 'https://home.alice.example/data/projects';
    const agentId = 'https://bob.example';

    const request = new ListDataInstancesRequest(agentId, registrationId);
    const expected = {
      type: RequestMessageTypes.LIST_DATA_INSTANCES_REQUEST,
      agentId,
      registrationId
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('ApplicationAuthorizationRequest (granted)', () => {
    const authorization = {
      grantee: 'https://app.example',
      agentType: AgentType.Application,
      granted: true as const,
      accessNeedGroup: 'https://app.example/access-needs#group',
      dataAuthorizations: [
        {
          accessNeed: 'https://app.example/access-needs#project',
          scope: 'Inherited'
        }
      ]
    };
    const request = new ApplicationAuthorizationRequest(authorization);
    const expected = {
      type: RequestMessageTypes.APPLICATION_AUTHORIZATION,
      authorization
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('ApplicationAuthorizationRequest (not granted)', () => {
    const authorization = {
      grantee: 'https://app.example',
      agentType: AgentType.Application,
      granted: false as const,
      accessNeedGroup: 'https://app.example/access-needs#group'
    };
    const request = new ApplicationAuthorizationRequest(authorization);
    const expected = {
      type: RequestMessageTypes.APPLICATION_AUTHORIZATION,
      authorization
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('ResourceRequest', () => {
    const id = 'https://work.alice.example/some-resource';
    const lang = 'en';

    const request = new ResourceRequest(id, lang);
    const expected = {
      type: RequestMessageTypes.RESOURCE_REQUEST,
      id,
      lang
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });

  test('ShareAuthorizationRequest', () => {
    const shareAuthorization = {
      applicationId: 'https://projectron.example',
      resource: 'https://work.alice.example/some-resource',
      agents: [] as string[],
      accessMode: [] as string[],
      children: [] as { shapeTree: string; accessMode: string[] }[]
    };

    const request = new ShareAuthorizationRequest(shareAuthorization);
    const expected = {
      type: RequestMessageTypes.SHARE_AUTHORIZATION,
      shareAuthorization
    };
    expect(JSON.parse(request.stringify())).toEqual(expected);
  });
});
