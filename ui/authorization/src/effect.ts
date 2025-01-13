import { FetchHttpClient, HttpClient, HttpClientRequest } from '@effect/platform';
import { RpcResolver } from '@effect/rpc';
import { HttpRpcResolverNoStream } from '@effect/rpc-http';
import { Effect, Layer } from 'effect';
import {
  AgentType,
  GetAuthoriaztionData,
  GetUnregisteredApplication,
  IRI,
  ListApplications,
  GetResource,
  ListSocialAgents,
  ListSocialAgentInvitations,
  type UiRpcRouter,
  ListDataRegistries,
  ListDataInstances,
  GetWebId,
  RegisterPushSubscription
} from '@janeirodigital/sai-api-messages';
import type { PushSubscription } from 'web-push';

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;

// Create the client
const makeClient = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  return HttpRpcResolverNoStream.make<UiRpcRouter>(
    client.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(`${backendBaseUrl}/api`))
      // HttpClient.tapRequest(Console.log)
    )
  ).pipe(RpcResolver.toClient);
});

const AuthFetch = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.RequestInit, {
      credentials: 'include'
    })
  )
);

const AuthLayer = FetchHttpClient.layer.pipe(Layer.provide(AuthFetch));

export async function getWebId() {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new GetWebId());
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function registerPushSubscription(subscription: PushSubscription) {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new RegisterPushSubscription({ subscription }));
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function listApplications() {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new ListApplications());
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function getUnregisteredApplication(id: string) {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new GetUnregisteredApplication({ id: IRI.make(id) }));
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function getAuthoriaztionData(agentId: string, agentType: AgentType, lang: string) {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new GetAuthoriaztionData({ agentId: IRI.make(agentId), agentType, lang }));
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function getResource(id: string, lang: string) {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new GetResource({ id: IRI.make(id), lang }));
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function listSocialAgents() {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new ListSocialAgents());
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function listSocialAgentInvitations() {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new ListSocialAgentInvitations());
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function listDataRegistries(agentId: string, lang: string) {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(new ListDataRegistries({ agentId: IRI.make(agentId), lang }));
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}

export async function listDataInstances(agentId: string, registrationId: string) {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* client(
      new ListDataInstances({ agentId: IRI.make(agentId), registrationId: IRI.make(registrationId) })
    );
  }).pipe(Effect.provide(AuthLayer));
  return Effect.runPromise(program);
}
