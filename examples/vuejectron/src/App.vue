<style>
a {
  text-decoration: none;
}
a:link {
  color: black;
}
a:visited {
  color: black;
}
</style>
<template>
  <Suspense>
    <router-view />
    <template #fallback>
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
//
</script>
