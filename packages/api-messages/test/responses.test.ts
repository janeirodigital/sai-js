import { describe, test, expect } from 'vitest';
import {
  AccessAuthorization,
  Application,
  ApplicationAuthorizationResponse,
  ApplicationsResponse,
  AuthorizationData,
  DataRegistriesResponse,
  DataRegistry,
  DescriptionsResponse,
  ListDataInstancesResponse,
  RequestAccessUsingApplicationNeedsResponse,
  Resource,
  ResourceResponse,
  ResponseMessageTypes,
  ShareAuthorizationConfirmation,
  ShareAuthorizationResponse,
  SocialAgent,
  SocialAgentInvitation,
  SocialAgentInvitationResponse,
  SocialAgentInvitationsResponse,
  SocialAgentResponse,
  SocialAgentsResponse,
  UnregisteredApplicationProfileResponse
} from '../src/index';

describe('ApplicationsResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: [{} as Application]
    };

    const response = new ApplicationsResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.APPLICATIONS_RESPONSE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED,
      payload: [{} as Application]
    };
    // @ts-ignore
    expect(() => new ApplicationsResponse(message)).toThrow('Invalid message type');
  });
});

describe('UnlistedApplicationProfileResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE,
      payload: {} as Partial<Application>
    };

    const response = new UnregisteredApplicationProfileResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED,
      payload: [{} as Application]
    };
    // @ts-ignore
    expect(() => new ApplicationsResponse(message)).toThrow('Invalid message type');
  });
});

describe('SocialAgentsResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE,
      payload: [{} as SocialAgent]
    };

    const response = new SocialAgentsResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: [{} as SocialAgent]
    };
    // @ts-ignore
    expect(() => new SocialAgentsResponse(message)).toThrow('Invalid message type');
  });
});

describe('SocialAgentResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
      payload: {} as SocialAgent
    };

    const response = new SocialAgentResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.SOCIAL_AGENT_RESPONSE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as SocialAgent
    };
    // @ts-ignore
    expect(() => new SocialAgentResponse(message)).toThrow('Invalid message type');
  });
});

describe('DescriptionsResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.DESCRIPTIONS_RESPONSE,
      payload: {} as AuthorizationData
    };

    const response = new DescriptionsResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.DESCRIPTIONS_RESPONSE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as SocialAgent
    };
    // @ts-ignore
    expect(() => new DescriptionsResponse(message)).toThrow('Invalid message type');
  });
});

describe('ApplicationAuthorizationResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED,
      payload: {} as AccessAuthorization
    };

    const response = new ApplicationAuthorizationResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as AccessAuthorization
    };
    // @ts-ignore
    expect(() => new ApplicationAuthorizationResponse(message)).toThrow('Invalid message type');
  });
});

describe('DataRegistriesResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.DATA_REGISTRIES_RESPONSE,
      payload: [{} as DataRegistry]
    };

    const response = new DataRegistriesResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.DATA_REGISTRIES_RESPONSE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as AccessAuthorization
    };
    // @ts-ignore
    expect(() => new DataRegistriesResponse(message)).toThrow('Invalid message type');
  });
});

describe('ListDataInstancesResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.LIST_DATA_INSTANCES_RESPONSE,
      payload: [{} as DataRegistry]
    };

    const response = new ListDataInstancesResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.LIST_DATA_INSTANCES_RESPONSE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as AccessAuthorization
    };
    // @ts-ignore
    expect(() => new ListDataInstancesResponse(message)).toThrow('Invalid message type');
  });
});

describe('ShareAuthorizationResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.SHARE_AUTHORIZATION_CONFIRMATION,
      payload: {} as ShareAuthorizationConfirmation
    };

    const response = new ShareAuthorizationResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.SHARE_AUTHORIZATION_CONFIRMATION);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
      payload: {} as SocialAgent
    };
    // @ts-ignore
    expect(() => new ShareAuthorizationResponse(message)).toThrow('Invalid message type');
  });
});

describe('ResourceResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.RESOURCE_RESPONSE,
      payload: {} as Resource
    };

    const response = new ResourceResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.RESOURCE_RESPONSE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
      payload: {} as SocialAgent
    };
    // @ts-ignore
    expect(() => new ResourceResponse(message)).toThrow('Invalid message type');
  });
});

describe('RequestAccessUsingApplicationNeedsResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.REQUEST_ACCESS_USING_APPLICATION_NEEDS_CONFIRMTION,
      payload: null as null
    };

    const response = new RequestAccessUsingApplicationNeedsResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.REQUEST_ACCESS_USING_APPLICATION_NEEDS_CONFIRMTION);
    expect(response.payload).toBe(null);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
      payload: {} as SocialAgent
    };
    // @ts-ignore
    expect(() => new RequestAccessUsingApplicationNeedsResponse(message)).toThrow('Invalid message type');
  });
});

describe('SocialAgentInvitationResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.INVITATION_REGISTRATION,
      payload: {} as SocialAgentInvitation
    };

    const response = new SocialAgentInvitationResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.INVITATION_REGISTRATION);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as SocialAgent
    };
    // @ts-ignore
    expect(() => new SocialAgentInvitationResponse(message)).toThrow('Invalid message type');
  });
});

describe('SocialAgentInvitationsResponse', () => {
  test('correct', () => {
    const message = {
      type: ResponseMessageTypes.SOCIAL_AGENT_INVITATIONS_RESPONSE,
      payload: [{} as SocialAgentInvitation]
    };

    const response = new SocialAgentInvitationsResponse(message);
    expect(response.type).toEqual(ResponseMessageTypes.SOCIAL_AGENT_INVITATIONS_RESPONSE);
    expect(response.payload).toBe(message.payload);
  });

  test('incorrect', () => {
    const message = {
      type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
      payload: {} as SocialAgent
    };
    // @ts-ignore
    expect(() => new SocialAgentInvitationResponse(message)).toThrow('Invalid message type');
  });
});
