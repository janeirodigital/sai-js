import type { CRUDDataRegistry } from '@janeirodigital/interop-data-model';
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import type { DataRegistration, DataRegistry } from '@janeirodigital/sai-api-messages';

const buildDataRegistry = async (
  registry: CRUDDataRegistry,
  descriptionsLang: string,
  saiSession: AuthorizationAgent
): Promise<DataRegistry> => {
  const registrations: DataRegistration[] = [];
  for await (const registration of registry.registrations) {
    const shapeTree = await saiSession.factory.readable.shapeTree(registration.registeredShapeTree, descriptionsLang);
    registrations.push({
      id: registration.iri,
      shapeTree: registration.registeredShapeTree,
      dataRegistry: registry.iri,
      count: registration.contains.length,
      label: shapeTree.descriptions[descriptionsLang]?.label
    });
  }
  return {
    id: registry.iri,
    registrations
  };
};

export const getDataRegistries = async (saiSession: AuthorizationAgent, descriptionsLang: string) => {
  return Promise.all(
    saiSession.registrySet.hasDataRegistry.map((registry) => buildDataRegistry(registry, descriptionsLang, saiSession))
  );
};
