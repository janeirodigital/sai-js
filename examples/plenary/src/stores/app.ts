import type { LdoBase } from '@ldo/ldo'
import {
  createSolidLdoDataset,
  changeData as ldoChangeData,
  commitData as ldoCommitData,
} from '@ldo/solid'
import { defineStore } from 'pinia'
import { ref } from 'vue'
// FAKE data
import data from '../../fake-data'
import {
  EventShapeType,
  OrganizationShapeType,
  PersonShapeType,
  RoleShapeType,
} from '../../ldo/Event$.shapeTypes'
import type { Event, Organization, Person, Role } from '../../ldo/Event$.typings'

type Pod = {
  id: string
  name: string
}

type Info = {
  id: string
  agent: string
  pod: string
}

type AgentId = string
type PodId = string
type RegistrationId = string

export const useAppStore = defineStore('app', () => {
  const dataset = createSolidLdoDataset()
  const events = ref<Event[]>([])
  const user = ref<Person>()
  const index: Record<string, Info> = {}
  const loaded: Set<string> = new Set()
  const userId = ref<string>()
  const organizations = ref<Organization[]>([])
  const agents = ref<AgentId[]>([])
  const pods = ref<Record<AgentId, Pod[]>>({})
  const registrations = ref<Record<PodId, RegistrationId>>({})

  // FAKE data
  // TODO change while adding SAI
  userId.value = 'https://alice.pod.docker/profile/card#me'
  agents.value = data.agents
  pods.value = data.pods
  registrations.value = data.registrations

  function fakeAvatar(id: string) {
    return `https://robohash.org/${encodeURIComponent(id)}.png?set=set2`
  }

  function newEventIri(podId: string): string {
    return `${podId}dataRegistry/events/${crypto.randomUUID()}`
  }

  function newPresenceIri(eventId: string): string {
    return eventId.replace(/events\/.*/, `presence/${crypto.randomUUID()}`)
  }

  // end FAKE

  function changeData<T extends LdoBase>(ldo: T): T {
    return ldoChangeData(ldo, dataset.getResource(ldo['@id']!))
  }

  async function commitData<T extends LdoBase>(ldo: T): Promise<void> {
    const result = await ldoCommitData(ldo)
    if (result.isError) throw result
  }

  async function loadResource(id: string): Promise<void> {
    const resource = dataset.getResource(id)
    const resourceResult = await resource.read()
    if (resourceResult.isError) throw resourceResult
  }

  async function loadUser(id: string): Promise<void> {
    await loadResource(id)
    user.value = dataset.usingType(PersonShapeType).fromSubject(id)
  }

  async function loadOrganizations(): Promise<void> {
    // TODO: in SAI use data owners
    if (organizations.value.length) return
    for (const id of agents.value) {
      await loadResource(id)
      const organization = dataset.usingType(OrganizationShapeType).fromSubject(id)
      organizations.value.push(organization)
      //@ts-expect-error
      for (const member of organization.member) {
        const resource = dataset.getResource(member['@id']!)
        if (!resource.isFetched()) await loadResource(member['@id']!)
      }
    }
  }

  async function loadEvents(): Promise<void> {
    if (!userId.value) return
    await loadUser(userId.value)
    if (events.value.length) return
    for (const agentId of agents.value) {
      if (!pods.value[agentId]) continue
      for (const pod of pods.value[agentId]) {
        if (!registrations.value[pod.id]) continue
        const container = dataset.getResource(registrations.value[pod.id])
        const readContainerResult = await container.read()
        if (readContainerResult.isError) throw readContainerResult
        if (container.type !== 'container') throw 'not a container'
        for (const child of container.children()) {
          const readChildContainerResult = await container.read()
          if (readChildContainerResult.isError) throw readChildContainerResult
          await loadResource(child.uri)
          const event = dataset.usingType(EventShapeType).fromSubject(child.uri)
          index[event['@id']!] = {
            id: event['@id']!,
            agent: agentId,
            pod: pod.id,
          }
          events.value.unshift(event)
        }
      }
    }
  }

  function cloneEvent(event: Event): Event {
    return dataset.usingType(EventShapeType).fromSubject(event['@id']!)
  }

  // trigger vue reactivty
  // TODO: integrate vue reactivity into LDO proxies
  function triggerEvent(event: Event): void {
    const eventIndex = events.value.indexOf(event)
    delete events.value[eventIndex]
    events.value[eventIndex] = cloneEvent(event)
  }

  async function createPresence(event: Event, agent: Person): Promise<Role> {
    const iri = newPresenceIri(event['@id']!)
    const presence = dataset.usingType(RoleShapeType).fromSubject(iri)
    const cPresence = changeData(presence)
    cPresence.type = { '@id': 'Role' }
    cPresence.agent = agent
    await commitData(cPresence)
    return presence
  }

  async function createEvent(
    eventName: string,
    organizationId: string,
    podId: string,
    chair: Person,
    startDate: Date
  ) {
    if (!(eventName && organizationId && podId && chair)) throw new Error('invalid event')
    const iri = newEventIri(podId)
    const event = dataset.usingType(EventShapeType).fromSubject(iri)
    const presence = await createPresence(event, chair)
    const cEvent = changeData(event)
    cEvent.type = { '@id': 'Event' }
    cEvent.chair = presence
    cEvent.name = eventName
    cEvent.startDate = startDate.toISOString()
    await commitData(cEvent)
    index[event['@id']!] = {
      id: event['@id']!,
      agent: organizationId,
      pod: podId,
    }
    loaded.add(event['@id']!)
    events.value.unshift(event)
  }

  async function loadPresence(presence: Role): Promise<void> {
    // presence
    await loadResource(presence['@id']!)
    // agent's profile
    await loadResource(presence.agent['@id']!)
  }

  async function loadDetails(event: Event): Promise<void> {
    // do nothing if already loaded
    if (event.chair.agent) return
    // chair
    await loadPresence(event.chair)
    // scribe
    if (event.scribe) await loadPresence(event.scribe)
    // attendees
    if (event.attendee) {
      await Promise.all(event.attendee.map((attendee) => loadPresence(attendee)))
    }
    // absentees
    if (event.absentee) {
      await Promise.all(event.absentee.map((absentee) => loadPresence(absentee)))
    }
    loaded.add(event['@id']!)
    triggerEvent(event)
  }

  function getAgent(event: Event): string {
    const info = index[event['@id']!]
    return info.agent
  }

  function getPod(event: Event): Pod | undefined {
    const info = index[event['@id']!]
    return pods.value[info.agent].find((p) => p.id === info.pod)
  }

  function formatDateTime(dateTime: string) {
    return new Date(dateTime).toLocaleString(navigator.language, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  function formatDate(dateTime: Date | string | undefined) {
    if (!dateTime) return
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
    return date.toLocaleString(navigator.language, { dateStyle: 'short', timeStyle: undefined })
  }

  function formatTime(dateTime: Date | string | undefined) {
    if (!dateTime) return
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
    return date.toLocaleString(navigator.language, { dateStyle: undefined, timeStyle: 'short' })
  }

  function haveDetailsLoaded(event): boolean {
    return loaded.has(event['@id']!)
  }

  function isMe(agent: Person) {
    if (!user.value) return
    return user.value['@id']! === agent['@id']
  }

  function amIChair(event: Event) {
    if (!user.value || !event.chair) return
    return user.value['@id']! === event.chair.agent['@id']
  }

  function isPresenceSet(event: Event) {
    if (!user.value || !haveDetailsLoaded(event)) return
    return (
      user.value['@id']! === event.chair.agent['@id'] ||
      user.value['@id']! === event.scribe?.agent['@id'] ||
      //@ts-expect-error
      event.attendee
        .map((presence) => presence.agent['@id'])
        .includes(user.value['@id']) ||
      //@ts-expect-error
      event.absentee
        .map((presence) => presence.agent['@id'])
        .includes(user.value['@id'])
    )
  }

  async function setScribe(event: Event, attendee: Role): Promise<void> {
    if (event.scribe) return
    const cEvent = changeData(event)
    cEvent.scribe = attendee
    //@ts-expect-error
    cEvent.attendee = cEvent.attendee.filter((a) => a['@id'] !== attendee['@id'])
    await commitData(cEvent)
    triggerEvent(event)
  }

  async function removeScribe(event: Event) {
    if (!event.scribe) return
    const cEvent = changeData(event)
    //@ts-expect-error
    cEvent.attendee.push(cEvent.scribe)
    cEvent.scribe = undefined
    await commitData(cEvent)
    triggerEvent(event)
  }

  async function setPresent(event: Event, absentee: Role) {
    const cEvent = changeData(event)
    //@ts-expect-error
    cEvent.attendee.push(absentee)
    //@ts-expect-error
    cEvent.absentee = cEvent.absentee.filter((a) => a['@id'] !== absentee['@id'])
    await commitData(cEvent)
    triggerEvent(event)
  }

  async function setAbsent(event: Event, attendee: Role) {
    const cEvent = changeData(event)
    //@ts-expect-error
    cEvent.absentee.unshift(attendee)
    //@ts-expect-error
    cEvent.attendee = cEvent.attendee.filter((a) => a['@id'] !== attendee['@id'])
    await commitData(cEvent)
    triggerEvent(event)
  }

  async function present(event: Event) {
    if (!user.value) return
    const cEvent = changeData(event)
    const attendee = await createPresence(event, user.value)
    //@ts-expect-error
    cEvent.attendee.push(attendee)
    await commitData(cEvent)
    triggerEvent(event)
  }

  async function absent(event: Event) {
    if (!user.value) return
    const cEvent = changeData(event)
    const absentee = await createPresence(event, user.value)
    //@ts-expect-error
    cEvent.absentee.push(absentee)
    await commitData(cEvent)
    triggerEvent(event)
  }

  return {
    events,
    user,
    organizations,
    pods,
    formatDateTime,
    formatDate,
    formatTime,
    fakeAvatar,
    loadOrganizations,
    loadEvents,
    createEvent,
    loadDetails,
    getAgent,
    getPod,
    isMe,
    amIChair,
    isPresenceSet,
    haveDetailsLoaded,
    setScribe,
    removeScribe,
    setPresent,
    setAbsent,
    present,
    absent,
  }
})
