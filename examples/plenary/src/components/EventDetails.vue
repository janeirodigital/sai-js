<template>
  <v-card
    v-if="event && event.name"
    :title="event.name">
    <v-card-subtitle>
      {{ store.getAgent(event)?.name }} -
      {{ store.getPod(event)?.name }}
    </v-card-subtitle>
    <v-card-text>
      {{ store.formatDateTime(event.startDate) }}
      <v-alert
        v-if="!presenceSet()"
        color="blue"
      >
        <v-list-item
          class="me"
          :key="store.user.id"
          :title="store.user.name"
          :prependAvatar="store.fakeAvatar(store.user.id)"
        >
          <template
            #append
          >
            <v-btn
              @click="absent()"
              icon="mdi-minus-circle-outline"
            ></v-btn>
            <v-btn
              @click="present()"
              icon="mdi-plus-circle-outline"
            ></v-btn>
          </template>
        </v-list-item>
      </v-alert>
      <h3>Chair</h3>
      <v-list-item
        v-if="event.chair && event.chair.agent"
        :class="{ me: isMe(event.chair['@id']!)}"
        :key="event.chair['@id']"
        :title="event.chair.agent.label"
        :prependAvatar="store.fakeAvatar(event.chair.agent['@id']!)"
      >
      </v-list-item>
      <v-skeleton-loader
        v-else
        type="list-item-avatar"
      ></v-skeleton-loader>
      <h3>Scribe</h3>
      <v-list-item
        v-if="event.scribe && event.scribe.agent"
        :class="{ me: isMe(event.scribe['@id']!)}"
        :key="event.scribe['@id']!"
        :title="event.scribe?.agent.label"
        :prependAvatar="store.fakeAvatar(event.scribe?.agent['@id']!)"
      >
        <template
          v-if="isChair()"
          #append
        >
          <v-btn
            @click="removeScribe()"
            icon="mdi-close-circle-outline"
          ></v-btn>
        </template>
      </v-list-item>
      <v-skeleton-loader
        v-else-if="!event.chair.agent"
        type="list-item-avatar"
      ></v-skeleton-loader>
      <h3>Attendees</h3>
      <v-list
        v-if="event.attendee && event.attendee[0]?.agent"
      >
        <v-list-item
          v-for="attendee of event.attendee"
          :class="{ me: isMe(attendee['@id']!)}"
          :key="attendee['@id']"
          :title="attendee.agent.label"
          :prependAvatar="store.fakeAvatar(attendee?.agent['@id']!)"
        >
          <template
            v-if="isChair() && !event.scribe"
            #append
          >
            <v-btn
              @click="setScribe(attendee)"
              icon="mdi-circle-edit-outline"
            ></v-btn>
          </template>
          <template
            v-else-if="isChair()"
            #append
          >
            <v-btn
              @click="setAbsent(attendee)"
              icon="mdi-minus-circle-outline"
            ></v-btn>
          </template>
          <template
            v-else-if="isMe(attendee)"
            #append
          >
            <v-btn
              @click="unsetPresence()"
              icon="mdi-close-circle-outline"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
      <v-skeleton-loader
        v-else-if="!event.chair.agent"
        type="list-item-avatar@3"
      ></v-skeleton-loader>
      <h3>Absentees</h3>
      <v-list
        v-if="event.absentee && event.absentee[0]?.agent"
      >
        <v-list-item
          v-for="absentee of event.absentee"
          :class="{ me: isMe(absentee['@id']!)}"
          :key="absentee['@id']"
          :title="absentee?.agent?.label"
          :prependAvatar="store.fakeAvatar(absentee?.agent['@id']!)"
        >
          <template
            v-if="isChair()"
            #append
          >
            <v-btn
              @click="setPresent(absentee)"
              icon="mdi-plus-circle-outline"
            ></v-btn>
          </template>
          <template
            v-else-if="isMe(absentee)"
            #append
          >
            <v-btn
              @click="unsetPresence()"
              icon="mdi-close-circle-outline"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
      <v-skeleton-loader
        v-else-if="!event.chair.agent"
        type="list-item-avatar@3"
      ></v-skeleton-loader>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { useAppStore } from '../stores/app'
  import { computed, watchEffect } from 'vue';

  const route = useRoute()
  const store = useAppStore()
  store.loadEvents()
  const event = computed(() => store.events.find(e => e['@id'] === route.query.event))
  watchEffect(() => {
    if (!event.value) return
    store.loadDetails(event.value)
  }) 
  
  function removeScribe() {
    if (event.value && event.value.scribe) {
      if (!event.value.attendee) {
        event.value.attendee = []
      }
      event.value.attendee.unshift(event.value.scribe)
      delete event.value.scribe
    }
  }

  function presenceSet() {
    if (!event.value) return
    return store.user.id === event.value.chair['@id']
      || store.user.id === event.value.scribe?.['@id']
      || event.value.attendee?.find(a => store.user.id === a['@id'])
      || event.value.absentee?.find(a => store.user.id === a['@id'])
  }

  function unsetPresence() {
    if (!event.value) return
    if (event.value.attendee?.find(a => store.user.id === a['@id'])) {
      event.value.attendee = event.value.attendee?.filter(a => store.user.id !== a['@id'])
    }
    if (event.value.absentee?.find(a => store.user.id === a['@id'])) {
      event.value.absentee = event.value.absentee?.filter(a => store.user.id !== a['@id'])
    }
  }

  function present() {
    if (!event.value) return
    if (!event.value.attendee) {
      event.value.attendee = []
    }
    // event.value.attendee.unshift(store.user)
  }

  function absent() {
    if (!event.value) return
    if (!event.value.absentee) {
      event.value.absentee = []
    }
    // event.value.absentee.unshift(store.user)
  }

  function isMe(id: string) {
    return store.user.id === id
  }
  
  function isChair() {
    return store.user.id === event.value?.chair['@id']
  }

  function setScribe(agent) {
    if (!event.value) return
    event.value.scribe = agent
      if (!event.value.attendee) {
        event.value.attendee = []
      }
    event.value.attendee = event.value.attendee.filter(a => a['@id'] !== agent.id)
  }

  function setPresent(agent) {
    if (!event.value) return
    if (!event.value.attendee) {
      event.value.attendee = []
    }
    event.value.attendee.unshift(agent)
    event.value.absentee = event.value.absentee?.filter(a => a['@id'] !== agent.id)
  }

  function setAbsent(agent) {
    if (!event.value) return
    if (!event.value.absentee) {
      event.value.absentee = []
    }
    event.value.absentee.unshift(agent)
    event.value.attendee = event.value.attendee?.filter(a => a['@id'] !== agent.id)
  }
</script>

<style>
  h3 {
    margin-top: 1.5rem;
  }
  .me .v-avatar {
    border: 2px solid greenyellow;
  }
  .me .v-btn {
    margin-left: 1rem;
  }
</style>
