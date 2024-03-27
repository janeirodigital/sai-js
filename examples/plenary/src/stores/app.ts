// Utilities
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createSolidLdoDataset } from '@ldo/solid'
import { EventShapeType } from '../../ldo/Event$.shapeTypes'
import { Event, Role } from '../../ldo/Event$.typings'

type Agent = {
  id: string
  name: string
}

type Pod = {
  id: string
  name: string
}

const data = {
  agents: [
    {
      id: 'http://localhost:3000/acme/profile/card#me',
      name: 'ACME'
    },
    {
      id: 'http://localhost:3000/alice/profile/card#me',
      name: 'Alice'
    }
  ],
  pods: {
    'http://localhost:3000/acme/profile/card#me': [
      {
        id: 'http://localhost:3000/acme-hr/',
        name: 'HR'
      },
      {
        id: 'http://localhost:3000/acme-rnd/',
        name: 'RnD'
      }
   ]
  },
  events: {
    'http://localhost:3000/acme-hr/': 'http://localhost:3000/acme-hr/dataRegistry/events/',
    'http://localhost:3000/acme-rnd/': 'http://localhost:3000/acme-rnd/dataRegistry/events/'
  }
}

type Info = {
  id: string
  agent: string,
  pod: string
}

export const useAppStore = defineStore('app', () => {
  const dataset = createSolidLdoDataset()
  const events = ref<Event[]>([])
  const user = ref({
    id: 'https://pavlik.example',
    name: 'Pavlik'
  })
  const index: Record<string, Info> = {}
  
  async function loadResource(id: string): Promise<void> {
    const resource = dataset.getResource(id)
    const resourceResult = await resource.read()
    if (resourceResult.isError) throw resourceResult
  }

  async function loadEvents(): Promise<void> {
    if (events.value.length) return
    for (const agent of data.agents) {
      if (!data.pods[agent.id]) continue
      for (const pod of data.pods[agent.id]) {
      if (!data.events[pod.id]) continue
      const container = dataset.getResource(data.events[pod.id])
        const readContainerResult = await container.read()
        if (readContainerResult.isError) throw readContainerResult
        if (container.type !== 'container') throw 'not a container'
        for (const child of container.children()) {
          await loadResource(child.uri)
          const event = dataset.usingType(EventShapeType).fromSubject(child.uri)
          index[event['@id']!] = {
            id: event['@id']!,
            agent: agent.id,
            pod: pod.id
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
    const index = events.value.indexOf(event)
    delete events.value[index]
    events.value[index] = cloneEvent(event)
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
      await Promise.all(event.attendee.map(attendee => loadPresence(attendee)))
    }
    // absentees
    if (event.absentee) {
      await Promise.all(event.absentee.map(absentee => loadPresence(absentee)))
    }
    triggerEvent(event)
  }

  function getAgent(event: Event): Agent | undefined {
    const info = index[event['@id']!]
    return data.agents.find(a => a.id === info.agent)
  }
  
  function getPod(event: Event): Pod | undefined {
    const info = index[event['@id']!]
    return data.pods[info.agent].find(p => p.id === info.pod)
  }
  
  function formatDateTime(dateTime: string) {
    return new Date(dateTime).toLocaleString(
      navigator.language,
      { dateStyle: 'short', timeStyle: 'short'  }
    )
  }
  
  function fakeAvatar(id: string) {
    return `https://robohash.org/${encodeURIComponent(id)}.png?set=set2`
  }
  
  return {
    events,
    user,
    formatDateTime,
    fakeAvatar,
    loadEvents,
    loadDetails,
    getAgent,
    getPod
  }
})
