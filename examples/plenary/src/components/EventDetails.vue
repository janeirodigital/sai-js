<template>
  <v-card
    v-if="event && event.name"
    :title="event.name"
  >
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
          :key="store.user['@id']!"
          class="me"
          :title="store.user.label"
          :prepend-avatar="store.fakeAvatar(store.user['@id']!)"
        >
          <template
            #append
          >
            <v-btn
              icon="mdi-minus-circle-outline"
              @click="store.absent(event)"
            />
            <v-btn
              icon="mdi-plus-circle-outline"
              @click="store.present(event)"
            />
          </template>
        </v-list-item>
      </v-alert>
      <h3>Chair</h3>
      <v-list-item
        v-if="event.chair && event.chair.agent"
        :key="event.chair['@id']"
        :class="{ me: store.isMe(event.chair.agent)}"
        :title="event.chair.agent.label"
        :prepend-avatar="store.fakeAvatar(event.chair.agent['@id']!)"
      />
      <v-skeleton-loader
        v-else
        type="list-item-avatar"
      />
      <h3>Scribe</h3>
      <v-list-item
        v-if="event.scribe && event.scribe.agent"
        :key="event.scribe['@id']!"
        :class="{ me: store.isMe(event.scribe.agent)}"
        :title="event.scribe?.agent.label"
        :prepend-avatar="store.fakeAvatar(event.scribe?.agent['@id']!)"
      >
        <template
          v-if="store.amIChair(event)"
          #append
        >
          <v-btn
            icon="mdi-close-circle-outline"
            @click="store.removeScribe(event)"
          />
        </template>
      </v-list-item>
      <v-skeleton-loader
        v-else-if="!event.chair.agent"
        type="list-item-avatar"
      />
      <h3>Attendees</h3>
      <v-list
        v-if="event.attendee && event.attendee[0]?.agent"
      >
        <v-list-item
          v-for="attendee of event.attendee"
          :key="attendee['@id']"
          :class="{ me: store.isMe(attendee.agent)}"
          :title="attendee.agent.label"
          :prepend-avatar="store.fakeAvatar(attendee?.agent['@id']!)"
        >
          <template
            v-if="store.amIChair(event) && !event.scribe"
            #append
          >
            <v-btn
              icon="mdi-circle-edit-outline"
              @click="store.setScribe(event, attendee)"
            />
          </template>
          <template
            v-else-if="store.amIChair(event) || store.isMe(attendee.agent)"
            #append
          >
            <v-btn
              icon="mdi-minus-circle-outline"
              @click="store.setAbsent(event, attendee)"
            />
          </template>
        </v-list-item>
      </v-list>
      <v-skeleton-loader
        v-else-if="!event.chair.agent"
        type="list-item-avatar@3"
      />
      <h3>Absentees</h3>
      <v-list
        v-if="event.absentee && event.absentee[0]?.agent"
      >
        <v-list-item
          v-for="absentee of event.absentee"
          :key="absentee['@id']"
          :class="{ me: store.isMe(absentee.agent)}"
          :title="absentee?.agent?.label"
          :prepend-avatar="store.fakeAvatar(absentee?.agent['@id']!)"
        >
          <template
            v-if="store.amIChair(event) || store.isMe(absentee.agent)"
            #append
          >
            <v-btn
              icon="mdi-plus-circle-outline"
              @click="store.setPresent(event, absentee)"
            />
          </template>
        </v-list-item>
      </v-list>
      <v-skeleton-loader
        v-else-if="!event.chair.agent"
        type="list-item-avatar@3"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const route = useRoute()
const store = useAppStore()

const event = computed(() => store.events.find((e) => e['@id'] === route.query.event))

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
