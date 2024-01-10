import {
  CRUDSocialAgentRegistration,
  DataAuthorizationData,
  InheritedDataGrant,
  ReadableAccessNeed,
  ReadableAccessNeedGroup
} from '@janeirodigital/interop-data-model';
import type {
  AuthorizationAgent,
  AccessAuthorizationStructure,
  NestedDataAuthorizationData
} from '@janeirodigital/interop-authorization-agent';
import { INTEROP } from '@janeirodigital/interop-utils';
import {
  AuthorizationData,
  Authorization,
  AccessAuthorization,
  AccessNeed,
  AgentType,
  GrantedAuthorization,
  DataOwner,
  DataRegistration,
  DataInstance
} from '@janeirodigital/sai-api-messages';

const formatAccessNeed = async (accessNeed: ReadableAccessNeed, descriptionsLang: string): Promise<AccessNeed> => {
  const description = await accessNeed.getDescription(descriptionsLang);
  const shapeTreeDescription = await accessNeed.shapeTree.getDescription(descriptionsLang);

  const formatted = {
    id: accessNeed.iri,
    label: description.label,
    description: description.definition,
    required: accessNeed.required,
    access: accessNeed.accessMode,
    shapeTree: {
      id: accessNeed.shapeTree.iri,
      label: shapeTreeDescription.label
    }
  } as AccessNeed;
  if (accessNeed.inheritsFromNeed) {
    formatted.parent = accessNeed.inheritsFromNeed;
  }
  if (accessNeed.children) {
    formatted.children = await Promise.all(
      accessNeed.children.map((child) => formatAccessNeed(child, descriptionsLang))
    );
  }
  return formatted;
};

async function findUserDataRegistrations(
  accessNeedGroup: ReadableAccessNeedGroup,
  saiSession: AuthorizationAgent
): Promise<DataRegistration[]> {
  const dataRegistrations: DataRegistration[] = [];
  for (const dataRegistry of saiSession.registrySet.hasDataRegistry) {
    for (const accessNeed of accessNeedGroup.accessNeeds) {
      // eslint-disable-next-line no-await-in-loop
      const dataRegistration = await saiSession.findDataRegistration(dataRegistry.iri, accessNeed.shapeTree.iri);
      if (dataRegistration)
        dataRegistrations.push({
          id: dataRegistration.iri,
          dataRegistry: dataRegistry.iri,
          label: `${dataRegistration.iri.split('/').slice(0, 4).join('/')}/`, // TODO get proper label,
          shapeTree: accessNeed.shapeTree.iri,
          count: dataRegistration.contains.length
        });
    }
  }
  return dataRegistrations;
}

async function findSocialAgentDataRegistrations(
  socialAgentRegistration: CRUDSocialAgentRegistration,
  accessNeedGroup: ReadableAccessNeedGroup,
  saiSession: AuthorizationAgent
): Promise<DataRegistration[]> {
  const dataRegistrations: DataRegistration[] = [];
  if (!socialAgentRegistration.accessGrant) return [];
  for (const dataGrant of socialAgentRegistration.accessGrant.hasDataGrant) {
    for (const accessNeed of accessNeedGroup.accessNeeds) {
      if (
        dataGrant.registeredShapeTree === accessNeed.shapeTree.iri &&
        !(dataGrant instanceof InheritedDataGrant) // TODO clarify case when this could happen
      ) {
        dataRegistrations.push({
          id: dataGrant.hasDataRegistration,
          label: `${dataGrant.hasDataRegistration.split('/').slice(0, 4).join('/')}/`, // TODO get proper label
          shapeTree: accessNeed.shapeTree.iri,
          // @ts-ignore
          count: dataGrant.hasDataInstance
            ? // @ts-ignore
              dataGrant.hasDataInstance.length
            : // eslint-disable-next-line no-await-in-loop
              (await saiSession.factory.readable.dataRegistration(dataGrant.hasDataRegistration)).contains.length
        });
      }
    }
  }
  return dataRegistrations;
}

/**
 * Get the descriptions for the requested language. If the descriptions for the language are not found
 * `null` will be returned.
 * @param applicationIri application's profile document IRI
 * @param preferredLang XSD language requested, e.g.: "en", "es", "i-navajo".
 * @param saiSession Authoirization Agent from `@janeirodigital/interop-authorization-agent`
 */
export const getDescriptions = async (
  agentIri: string,
  agentType: AgentType,
  preferredLang: string,
  saiSession: AuthorizationAgent
): Promise<AuthorizationData | null> => {
  let accessNeedGroupIri: string;
  if (agentType === AgentType.Application) {
    const clientIdDocument = await saiSession.factory.readable.clientIdDocument(agentIri);
    if (!clientIdDocument.hasAccessNeedGroup) return null;
    accessNeedGroupIri = clientIdDocument.hasAccessNeedGroup;
  } else if (agentType === AgentType.SocialAgent) {
    const socialAgentRegistration = await saiSession.findSocialAgentRegistration(agentIri);
    if (!socialAgentRegistration) throw new Error(`registration not found for ${agentIri}`);
    accessNeedGroupIri = socialAgentRegistration.reciprocalRegistration?.hasAccessNeedGroup;
    if (!accessNeedGroupIri) return null;
  } else throw new Error('wrong agent type');

  const accessNeedGroup = await saiSession.factory.readable.accessNeedGroup(accessNeedGroupIri, preferredLang);

  const dataOwners: DataOwner[] = [
    {
      id: saiSession.webId,
      label: saiSession.webId, // TODO get from user's webid document
      dataRegistrations: await findUserDataRegistrations(accessNeedGroup, saiSession)
    }
  ];

  for await (const socialAgentRegistration of saiSession.socialAgentRegistrations) {
    if (socialAgentRegistration.reciprocalRegistration) {
      const dataRegistrations = await findSocialAgentDataRegistrations(
        socialAgentRegistration.reciprocalRegistration,
        accessNeedGroup,
        saiSession
      );
      if (dataRegistrations.length) {
        dataOwners.push({
          id: socialAgentRegistration.registeredAgent,
          label: socialAgentRegistration.label,
          dataRegistrations
        });
      }
    }
  }
  const descriptionLanguages = [...accessNeedGroup.reliableDescriptionLanguages];
  const descriptionsLang = accessNeedGroup.reliableDescriptionLanguages.has(preferredLang)
    ? preferredLang
    : descriptionLanguages[0];
  const descriptions = await accessNeedGroup.getDescription(descriptionsLang);

  return {
    // TODO if the id is the unique id of something then it should not be its own id. It should refer by a different name,
    //      e.g.: applicationId and be documented as such
    id: agentIri,
    agentType,
    accessNeedGroup: {
      id: accessNeedGroup.iri,
      label: descriptions.label,
      description: descriptions.definition,
      needs: await Promise.all(accessNeedGroup.accessNeeds.map((need) => formatAccessNeed(need, descriptionsLang))),
      descriptionLanguages,
      lang: descriptionsLang
    },
    dataOwners
  };
};

export const listDataInstances = async (
  agentId: string,
  registrationId: string,
  saiSession: AuthorizationAgent
): Promise<DataInstance[]> => {
  const dataInstances: DataInstance[] = [];
  if (agentId === saiSession.webId) {
    const dataRegistration = await saiSession.factory.readable.dataRegistration(registrationId);
    for (const dataInstanceIri of dataRegistration.contains) {
      // eslint-disable-next-line no-await-in-loop
      const dataInstance = await saiSession.factory.readable.dataInstance(dataInstanceIri);
      dataInstances.push({
        id: dataInstance.iri,
        label: dataInstance.label
      });
    }
  } else {
    const socialAgentRegistration = (await saiSession.findSocialAgentRegistration(agentId)).reciprocalRegistration;
    if (!socialAgentRegistration) {
      throw new Error(`missing social agent registration: ${agentId}`);
    }
    if (!socialAgentRegistration.accessGrant) {
      throw new Error(`missing access grant for social agent: ${agentId}`);
    }
    for (const dataGrant of socialAgentRegistration.accessGrant.hasDataGrant) {
      if (dataGrant.hasDataRegistration === registrationId) {
        // TODO: optimize not to create crud data instances
        // eslint-disable-next-line no-await-in-loop
        for await (const instance of dataGrant.getDataInstanceIterator()) {
          const dataInstance = await saiSession.factory.readable.dataInstance(instance.iri);
          dataInstances.push({
            id: dataInstance.iri,
            label: dataInstance.label
          });
        }
      }
    }
  }

  return dataInstances;
};

// currently the spec only anticipates one level of inheritance
// since we still don't have IRIs at this point, we need to use nesting to represent inheritance
// TODO validate all scopes
function buildDataAuthorizations(
  authorization: GrantedAuthorization,
  accessNeedGroup: ReadableAccessNeedGroup
): NestedDataAuthorizationData[] {
  const structuredDataAuthorizations = authorization.dataAuthorizations.map((dataAuthorization) => {
    const accessNeed = accessNeedGroup.accessNeeds
      .flatMap((need) => [need, ...(need.children ?? [])])
      .find((need) => need.iri === dataAuthorization.accessNeed);
    if (!accessNeed) {
      throw new Error(`missing access need: ${dataAuthorization.accessNeed}`);
    }
    const saiReady: DataAuthorizationData = {
      satisfiesAccessNeed: accessNeed.iri,
      grantee: authorization.grantee,
      registeredShapeTree: accessNeed.shapeTree.iri,
      scopeOfAuthorization: INTEROP[dataAuthorization.scope].value,
      accessMode: accessNeed!.accessMode
    };
    if (saiReady.scopeOfAuthorization === INTEROP.AllFromAgent.value) {
      saiReady.dataOwner = dataAuthorization.dataOwner;
    } else if (saiReady.scopeOfAuthorization === INTEROP.AllFromRegistry.value) {
      saiReady.dataOwner = dataAuthorization.dataOwner;
      saiReady.hasDataRegistration = dataAuthorization.dataRegistration;
    } else if (saiReady.scopeOfAuthorization === INTEROP.SelectedFromRegistry.value) {
      saiReady.dataOwner = dataAuthorization.dataOwner;
      saiReady.hasDataRegistration = dataAuthorization.dataRegistration;
      saiReady.hasDataInstance = dataAuthorization.dataInstances;
    }
    return saiReady;
  });
  const parents: NestedDataAuthorizationData[] = [];
  const children: DataAuthorizationData[] = [];
  for (const structuredDataAuthorization of structuredDataAuthorizations) {
    if (structuredDataAuthorization.scopeOfAuthorization === INTEROP.Inherited.value) {
      children.push(structuredDataAuthorization);
    } else {
      parents.push(structuredDataAuthorization);
    }
  }
  return parents.map((parentDataAuthorization) => {
    // add children for each parent
    const inheritingDataAuthorizations = children.filter((childDataAuthorization) => {
      const accessNeed = accessNeedGroup.accessNeeds
        .flatMap((need) => [need, ...(need.children ?? [])])
        .find((need) => need.iri === childDataAuthorization.satisfiesAccessNeed)!;

      return accessNeed.inheritsFromNeed === parentDataAuthorization.satisfiesAccessNeed;
    });
    if (inheritingDataAuthorizations.length) {
      return { ...parentDataAuthorization, children: inheritingDataAuthorizations };
    }
    return parentDataAuthorization;
  });
}

export const recordAuthorization = async (
  authorization: Authorization,
  saiSession: AuthorizationAgent
): Promise<AccessAuthorization> => {
  let structure: AccessAuthorizationStructure;
  if (authorization.granted) {
    const accessNeedGroup = await saiSession.factory.readable.accessNeedGroup(authorization.accessNeedGroup);
    structure = {
      grantee: authorization.grantee,
      hasAccessNeedGroup: authorization.accessNeedGroup,
      dataAuthorizations: buildDataAuthorizations(authorization, accessNeedGroup),
      granted: true
    };
  } else {
    structure = {
      grantee: authorization.grantee,
      hasAccessNeedGroup: authorization.accessNeedGroup,
      granted: false
    };
  }

  const recorded = await saiSession.recordAccessAuthorization(structure);
  const response = { id: recorded.iri, ...authorization } as AccessAuthorization;
  if (authorization.agentType === AgentType.Application) {
    // we need to ensure that Application Registration exists before generating Access Grant!
    if (!(await saiSession.findApplicationRegistration(authorization.grantee))) {
      await saiSession.registrySet.hasAgentRegistry.addApplicationRegistration(authorization.grantee);
    }
    const clientIdDocument = await saiSession.factory.readable.clientIdDocument(authorization.grantee);
    if (clientIdDocument.callbackEndpoint) {
      response.callbackEndpoint = clientIdDocument.callbackEndpoint;
    }
  }
  await saiSession.generateAccessGrant(recorded.iri);
  return response;
};
