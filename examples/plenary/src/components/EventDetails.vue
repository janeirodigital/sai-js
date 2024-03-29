<template>
  <v-card
    v-if="event && event.name"
    :title="event.name">
    <v-card-subtitle>
      {{ store.organizations.find(o => o['@id'] === store.getAgent(event!))?.label }} -
      {{ store.getPod(event)?.name }}
    </v-card-subtitle>
    <v-card-text>
      {{ store.formatDateTime(event.startDate) }}
      <v-alert
        v-if="store.haveDetailsLoaded(event) && !store.isPresenceSet(event)"
        color="blue"
      >
        <v-list-item
          v-if="store.user"
          class="me"
          :key="store.user['@id']!"
          :title="store.user.label"
          :prependAvatar="store.fakeAvatar(store.user['@id']!)"
        >
          <template
            #append
          >
            <v-btn
              @click="store.absent(event)"
              icon="mdi-minus-circle-outline"
            ></v-btn>
            <v-btn
              @click="store.present(event)"
              icon="mdi-plus-circle-outline"
            ></v-btn>
          </template>
        </v-list-item>
      </v-alert>
      <h3>Chair</h3>
      <v-list-item
        v-if="event.chair && event.chair.agent"
        :class="{ me: store.isMe(event.chair.agent)}"
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
        :class="{ me: store.isMe(event.scribe.agent)}"
        :key="event.scribe['@id']!"
        :title="event.scribe?.agent.label"
        :prependAvatar="store.fakeAvatar(event.scribe?.agent['@id']!)"
      >
        <template
          v-if="store.amIChair(event)"
          #append
        >
          <v-btn
            @click="store.removeScribe(event)"
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
          :class="{ me: store.isMe(attendee.agent)}"
          :key="attendee['@id']"
          :title="attendee.agent.label"
          :prependAvatar="store.fakeAvatar(attendee?.agent['@id']!)"
        >
          <template
            v-if="store.amIChair(event) && !event.scribe"
            #append
          >
            <v-btn
              @click="store.setScribe(event, attendee)"
              icon="mdi-circle-edit-outline"
            ></v-btn>
          </template>
          <template
            v-else-if="store.amIChair(event) || store.isMe(attendee.agent)"
            #append
          >
            <v-btn
              @click="store.setAbsent(event, attendee)"
              icon="mdi-minus-circle-outline"
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
          :class="{ me: store.isMe(absentee.agent)}"
          :key="absentee['@id']"
          :title="absentee?.agent?.label"
          :prependAvatar="store.fakeAvatar(absentee?.agent['@id']!)"
        >
          <template
            v-if="store.amIChair(event) || store.isMe(absentee.agent)"
            #append
          >
            <v-btn
              @click="store.setPresent(event, absentee)"
              icon="mdi-plus-circle-outline"
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
  import { computed, watchEffect } from 'vue';
  import { useRoute } from 'vue-router'
  import { useAppStore } from '../stores/app'

  const route = useRoute()
  const store = useAppStore()

  const event = computed(() => store.events.find(e => e['@id'] === route.query.event))

  watchEffect(() => {
    if (!event.value) return
    store.loadDetails(event.value)
  }) 

  store.loadOrganizations()
  store.loadEvents()

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
