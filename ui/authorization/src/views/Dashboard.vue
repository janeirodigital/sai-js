<template>
  <v-main>
    <router-view></router-view>
  </v-main>
  <v-bottom-navigation>
    <v-btn :to="{name: 'application-list'}">
      <v-icon>mdi-apps</v-icon>

      <span>Apps</span>
    </v-btn>

    <v-btn :to="{name: 'social-agent-list'}">
      <v-icon>mdi-account-group</v-icon>

      <span>Peers</span>
    </v-btn>

    <v-btn :to="{name: 'data-registry-list'}">
      <v-icon>mdi-hexagon-multiple-outline</v-icon>

      <span>Data</span>
    </v-btn>
</v-bottom-navigation>
</template>

<script lang="ts" setup>
</script>
