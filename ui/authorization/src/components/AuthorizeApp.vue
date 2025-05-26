<template>
  <v-card
    v-if="application"
    :title="application.name"
    :prepend-avatar="application.logo"
  />
  <v-card
    v-if="agent"
    :title="agent.label"
    :subtitle="agent.note"
  />
  <v-alert
    v-if="coreStore.lang !== authorizationData.accessNeedGroup.lang"
    color="info"
    icon="mdi-translate"
  >
    <template #append>
      <template v-if="descriptionLanguages.length === 1">
        {{ descriptionLanguages[0].title }}
      </template>
      <template v-else>
        <v-select
          v-model="alternativeLang"
          :items="descriptionLanguages"
          :disabled="langLoading"
        />
      </template>
    </template>
  </v-alert>
  <v-skeleton-loader
    v-if="langLoading"
    type="card@2"
  />
  <v-card v-else>
    <v-card-text>
      <v-list-item
        lines="three"
        @click="toggleSelect(accessNeed.id)"
      >
        <v-list-item-title>
          <v-icon :icon="chooseIcon(accessNeed.access)" />
          {{ accessNeed.shapeTree.label }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ accessNeed.label }}
        </v-list-item-subtitle>
        <template #append>
          <v-list-item-action end>
            <v-checkbox-btn
              :model-value="isSelected(accessNeed.id)"
              :disabled="accessNeed.required"
              @click.prevent
            />
          </v-list-item-action>
        </template>
      </v-list-item>
      <v-list>
        <v-list-item
          v-for="child in accessNeed.children"
          :key="child.id"
          class="ml-3"
          lines="three"
          @click="toggleSelect(accessNeed.id, child.id)"
        >
          <v-list-item-title>
            <v-icon :icon="chooseIcon(child.access)" />
            {{ child.shapeTree.label }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ child.label }}
          </v-list-item-subtitle>
          <template #append>
            <v-list-item-action end>
              <v-checkbox-btn
                :model-value="isSelected(accessNeed.id, child.id)"
                :disabled="child.required"
                @click.prevent
              />
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
      <v-expansion-panels
        id="panel-hell"
        v-model="panelsOpened"
        variant="popout"
      >
        <v-expansion-panel value="top">
          <v-expansion-panel-title class="d-flex flex-row">
            <span class="flex-grow-1">{{ topLevelScope === 'all' ? $t('all-data') : $t('selected-data') }}</span>
            <v-chip
              color="agent"
              label
            >
              {{ props.authorizationData.dataOwners.length }}
            </v-chip>
            <template #actions>
              <v-badge
                color="agent"
                :content="statsForTopLevel()"
                :model-value="topLevelScope === 'some'"
              >
                <v-checkbox-btn
                  disabled
                  :indeterminate="topLevelScope === 'some'"
                  :model-value="topLevelScope === 'all'"
                  @click.prevent
                />
              </v-badge>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-btn-toggle
              v-model="topLevelScope"
              rounded="false"
              variant="outlined"
              mandatory
              class="d-flex flex-row"
            >
              <v-btn
                class="flex-grow-1"
                icon="mdi-checkbox-blank-outline"
                value="none"
              />
              <v-btn
                class="flex-grow-1"
                icon="mdi-minus-box-outline"
                value="some"
              />
              <v-btn
                class="flex-grow-1"
                icon="mdi-checkbox-outline"
                value="all"
              />
            </v-btn-toggle>
            <v-expansion-panels variant="popout">
              <v-expansion-panel
                v-for="owner in props.authorizationData.dataOwners"
                :key="owner.id"
                :disabled="topLevelScope !== 'some'"
              >
                <v-expansion-panel-title class="d-flex flex-row">
                  <template v-if="owner.id === coreStore.userId">
                    <v-icon
                      color="agent"
                      icon="mdi-account-circle"
                    />
                    <span class="label flex-grow-1">Me</span>
                  </template>
                  <template v-else>
                    <v-icon
                      color="agent"
                      icon="mdi-account-circle-outline"
                    />
                    <span class="label flex-grow-1">{{ owner.label }}</span>
                  </template>
                  <v-chip
                    color="primary"
                    label
                  >
                    {{ owner.dataRegistrations.length }}
                  </v-chip>
                  <template #actions>
                    <v-badge
                      color="primary"
                      :content="statsForAgent(owner.id)"
                      :model-value="agentsIndex[owner.id].scope === 'some'"
                    >
                      <v-checkbox-btn
                        disabled
                        :indeterminate="agentsIndex[owner.id].scope === 'some'"
                        :model-value="agentsIndex[owner.id].scope === 'all'"
                        @click.prevent
                      />
                    </v-badge>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-btn-toggle
                    :model-value="agentsIndex[owner.id].scope"
                    rounded="false"
                    variant="outlined"
                    mandatory
                    class="d-flex flex-row"
                    @update:model-value="agentScopeChanged(owner.id, $event)"
                  >
                    <v-btn
                      class="flex-grow-1"
                      icon="mdi-checkbox-blank-outline"
                      value="none"
                    />
                    <v-btn
                      class="flex-grow-1"
                      icon="mdi-minus-box-outline"
                      value="some"
                    />
                    <v-btn
                      class="flex-grow-1"
                      icon="mdi-checkbox-outline"
                      value="all"
                    />
                  </v-btn-toggle>
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel
                      v-for="registration in owner.dataRegistrations"
                      :key="registration.id"
                      :disabled="agentsIndex[owner.id].scope !== 'some'"
                    >
                      <v-expansion-panel-title class="d-flex flex-row">
                        <v-icon
                          color="primary"
                          icon="mdi-hexagon-outline"
                        />
                        <span class="label flex-grow-1">{{ registration.label }}</span>
                        <v-chip
                          color="secondary"
                          label
                        >
                          {{ registration.count }}
                        </v-chip>
                        <template #actions>
                          <v-badge
                            color="secondary"
                            :content="statsForRegistration(registration.id)"
                            :model-value="registrationsIndex[registration.id].scope === 'some'"
                          >
                            <v-checkbox-btn
                              disabled
                              :indeterminate="registrationsIndex[registration.id].scope === 'some'"
                              :model-value="registrationsIndex[registration.id].scope === 'all'"
                              @click.prevent
                            />
                          </v-badge>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-btn-toggle
                          :model-value="registrationsIndex[registration.id].scope"
                          rounded="false"
                          variant="outlined"
                          mandatory
                          class="d-flex flex-row"
                          @update:model-value="registrationScopeChanged(owner.id, registration.id, $event)"
                        >
                          <v-btn
                            class="flex-grow-1"
                            icon="mdi-checkbox-blank-outline"
                            value="none"
                          />
                          <v-btn
                            class="flex-grow-1"
                            icon="mdi-minus-box-outline"
                            value="some"
                          />
                          <v-btn
                            class="flex-grow-1"
                            icon="mdi-checkbox-outline"
                            value="all"
                          />
                        </v-btn-toggle>
                        <template v-if="registrationsIndex[registration.id].scope === 'some'">
                          <v-list v-if="appStore.loadedDataInstances[registration.id]">
                            <v-list-item
                              v-for="dataInstance of appStore.loadedDataInstances[registration.id]"
                              :key="dataInstance.id"
                              :disabled="registrationsIndex[registration.id].scope !== 'some'"
                              @click="toggleOneInstance(dataInstance.id)"
                            >
                              <v-list-item-title>
                                <v-icon
                                  color="secondary"
                                  icon="mdi-star-three-points-outline"
                                />
                                {{ dataInstance.label }}
                              </v-list-item-title>
                              <template #append>
                                <v-list-item-action v-if="dataInstancesIndex[dataInstance.id]">
                                  <v-checkbox-btn
                                    v-model="dataInstancesIndex[dataInstance.id].selected"
                                    :disabled="registrationsIndex[registration.id].scope !== 'some'"
                                    @click.prevent
                                  />
                                </v-list-item-action>
                              </template>
                            </v-list-item>
                          </v-list>
                          <v-skeleton-loader
                            v-else
                            type="list-item@2"
                          />
                        </template>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
    <div class="px-2 d-flex justify-space-between">
      <v-btn
        color="error"
        variant="tonal"
        :loading="loadingDeny"
        :disabled="loadingAuthorize"
        @click="authorize(false)"
      >
        {{ $t('deny') }}
      </v-btn>
      <v-btn
        color="success"
        variant="flat"
        size="large"
        :loading="loadingAuthorize"
        :disabled="loadingDeny || statsForTopLevel() === 0"
        @click="authorize()"
      >
        {{ $t('authorize') }}
      </v-btn>
    </div>
  </v-card>
</template>
<script lang="ts" setup>
import { useAppStore } from '@/store/app'
import { useCoreStore } from '@/store/core'
import {
  AccessModes,
  type AccessNeed,
  AgentType,
  type Application,
  type Authorization,
  type AuthorizationData,
  type BaseAuthorization,
  type DataAuthorization,
  type DataInstanceList,
  IRI,
  Scopes,
  type SocialAgent,
} from '@janeirodigital/sai-api-messages'
import type * as S from 'effect/Schema'
import locale from 'locale-codes'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VExpansionPanel } from 'vuetify/lib/components/index.mjs'

const router = useRouter()

const coreStore = useCoreStore()
const appStore = useAppStore()

const props = defineProps<{
  application?: Partial<S.Schema.Type<typeof Application>>
  agent?: S.Schema.Type<typeof SocialAgent>
  authorizationData: S.Schema.Type<typeof AuthorizationData>
  redirect: boolean
}>()
// TODO add stepper to support multiple top level access needs
const accessNeed = computed(() => props.authorizationData.accessNeedGroup.needs[0])

const alternativeLang = ref(props.authorizationData.accessNeedGroup.lang)
const langLoading = ref(false)
const descriptionLanguages = computed(() =>
  props.authorizationData.accessNeedGroup.descriptionLanguages.map((lang) => ({
    title: locale.getByTag(lang)?.local || lang,
    value: lang,
  }))
)

watch(accessNeed, (need) => {
  if (need) {
    langLoading.value = false
  }
})

watch(alternativeLang, (selectedLang) => {
  langLoading.value = true
  appStore.getAuthoriaztion(
    props.application?.id ?? props.agent!.id,
    props.application ? AgentType.Application : AgentType.SocialAgent,
    selectedLang
  )
})

type PropagatingScope = 'none' | 'all'
type Scope = PropagatingScope | 'some'

interface Agent {
  id: string
  scope: Scope
}

// TODO: add proper type from sai-api-messages
function buildAgentsIndex(data: typeof props.authorizationData.dataOwners): Record<string, Agent> {
  const index: Record<string, Agent> = {}
  for (const agent of data) {
    index[agent.id] = {
      id: agent.id,
      scope: 'all',
    }
  }
  return index
}

const agentsIndex = reactive<Record<string, Agent>>(
  buildAgentsIndex(props.authorizationData.dataOwners)
)

interface Registration {
  id: string
  agent: string
  scope: Scope
  count: number
}

// TODO: add proper type from sai-api-messages
function buildRegistrationsIndex(
  data: typeof props.authorizationData.dataOwners
): Record<string, Registration> {
  const index: Record<string, Registration> = {}
  for (const agent of data) {
    for (const registration of agent.dataRegistrations) {
      index[registration.id] = {
        id: registration.id,
        agent: agent.id,
        scope: 'all',
        count: registration.count!,
      }
    }
  }
  return index
}

const registrationsIndex = reactive<Record<string, Registration>>(
  buildRegistrationsIndex(props.authorizationData.dataOwners)
)

interface SelectableDataInstance {
  id: string
  registration: string
  agent: string
  selected: boolean
}

const dataInstancesIndex = reactive<Record<string, SelectableDataInstance>>({})

// TODO: add proper type from sai-api-messages
function addDataInstancesToIndex(
  agentId: string,
  registrationId: string,
  dataInstances: S.Schema.Type<typeof DataInstanceList>,
  selected: boolean
): void {
  for (const dataInstance of dataInstances) {
    dataInstancesIndex[dataInstance.id] = {
      id: dataInstance.id,
      registration: registrationId,
      agent: agentId,
      selected,
    }
  }
}

function findAgentRegistrations(agentId: string): Registration[] {
  return Object.values(registrationsIndex).filter((registration) => registration.agent === agentId)
}
function findRegistrationDataInstances(registrationId: string): SelectableDataInstance[] {
  return Object.values(dataInstancesIndex).filter(
    (dataInstance) => dataInstance.registration === registrationId
  )
}

const panelsOpened = ref<string[]>([])
const topLevelScope = ref<Scope>('all')

function setScopeForAgents(scope: PropagatingScope): void {
  for (const agent of Object.values(agentsIndex)) {
    agent.scope = scope
  }
}

// TODO: make propagation independent of DOM
onMounted(() => {
  // set default to current user
  if (props.agent) {
    topLevelScope.value = 'some'
    setScopeForAgents('none')
    agentsIndex[coreStore.userId!].scope = 'all'
    panelsOpened.value = ['top']
  }
})

watch(topLevelScope, (newScope) => {
  if (newScope !== 'some') {
    setScopeForAgents(newScope)
  }
})

function setScopeForAgentRegistrations(agentId: string, scope: PropagatingScope): void {
  const registrations = findAgentRegistrations(agentId)
  for (const registration of registrations) {
    registration.scope = scope
  }
}

function agentScopeChanged(agentId: string, scope: Scope) {
  if (scope !== 'some') {
    setScopeForAgentRegistrations(agentId, scope)
  }
  agentsIndex[agentId].scope = scope
}

async function loadDataInstances(
  agentId: string,
  registrationId: string,
  selected: boolean
): Promise<void> {
  await appStore.listDataInstances(IRI.make(agentId), IRI.make(registrationId))
  addDataInstancesToIndex(
    agentId,
    registrationId,
    appStore.loadedDataInstances[registrationId],
    selected
  )
}

function setSelectedForRegistrationInstances(registrationId: string, selected: boolean): void {
  const dataInstances = findRegistrationDataInstances(registrationId)
  for (const dataInstance of dataInstances) {
    if (dataInstance.registration === registrationId) {
      dataInstance.selected = selected
    }
  }
}

function registrationScopeChanged(agentId: string, registrationId: string, scope: Scope) {
  if (scope !== 'some') {
    setSelectedForRegistrationInstances(registrationId, scope === 'all')
  } else if (!appStore.loadedDataInstances[registrationId]) {
    const previousScope = registrationsIndex[registrationId].scope
    loadDataInstances(agentId, registrationId, previousScope === 'all')
  }
  registrationsIndex[registrationId].scope = scope
}

function toggleOneInstance(instanceId: string) {
  const instance = dataInstancesIndex[instanceId]
  const registration = registrationsIndex[instance.registration]
  if (registration.scope === 'some') {
    // UI is also disabling the element
    dataInstancesIndex[instanceId].selected = !dataInstancesIndex[instanceId].selected
  }
}

function statsForRegistration(registrationId: string): number {
  const registration = registrationsIndex[registrationId]
  if (registration.scope === 'none') {
    return 0
  }
  if (registration.scope === 'all') {
    return registration.count
  }
  const dataInstances = findRegistrationDataInstances(registration.id)
  return dataInstances.filter((dataInstance) => dataInstance.selected).length
}

function statsForAgent(agentId: string): number {
  const agent = agentsIndex[agentId]
  if (agent.scope === 'none') {
    return 0
  }
  const registrations = findAgentRegistrations(agentId)
  if (agent.scope === 'all') {
    return registrations.length
  }
  return registrations.filter((registration) => statsForRegistration(registration.id)).length
}

function statsForTopLevel(): number {
  if (topLevelScope.value === 'none') {
    return 0
  }
  const agents = Object.values(agentsIndex)
  if (topLevelScope.value === 'all') {
    return agents.length
  }
  return agents.filter((agent) => statsForAgent(agent.id)).length
}

const loadingAuthorize = ref(false)
const loadingDeny = ref(false)
const selection = reactive({
  needs: props.authorizationData.accessNeedGroup.needs.map((n) => ({
    id: n.id,
    required: n.required,
    selected: true,
    children: n.children?.map((c) => ({
      id: c.id,
      required: c.required,
      selected: true,
    })),
  })),
})

function toggleSelect(needId: string, childId?: string): void {
  const need = selection.needs.find((n) => n.id === needId)!
  if (childId) {
    const child = need.children!.find((n) => n.id === childId)!
    if (child.required) return
    child.selected = !child.selected
  } else {
    if (need.required) return
    need.selected = !need.selected
  }
}

function isSelected(needId: string, childId?: string): boolean {
  const need = selection.needs.find((n) => n.id === needId)!
  if (childId) {
    const child = need.children!.find((n) => n.id === childId)!
    return child.selected
  }
  return need.selected
}

function chooseIcon(access: readonly S.Schema.Type<typeof IRI>[]): string {
  if (access.includes(IRI.make(AccessModes.Update))) {
    return 'mdi-square-edit-outline'
  }
  return 'mdi-euey-outline'
}

// TODO throw error if required need is not satisfied
function createDataAuthorizations(
  need: S.Schema.Type<typeof AccessNeed>,
  parent?: S.Schema.Type<typeof AccessNeed>
): S.Schema.Type<typeof DataAuthorization>[] {
  if (!parent && !isSelected(need.id)) return []
  if (parent && !isSelected(parent.id, need.id)) return []
  const dataAuthorizations: S.Schema.Type<typeof DataAuthorization>[] = []
  const accessNeedAuthorization = {
    accessNeed: need.id,
  } as Partial<S.Schema.Type<typeof DataAuthorization>>
  if (need.parent) {
    dataAuthorizations.push({
      ...accessNeedAuthorization,
      scope: Scopes.Inherited,
    } as S.Schema.Type<typeof DataAuthorization>)
  } else if (topLevelScope.value === 'all') {
    dataAuthorizations.push({
      ...accessNeedAuthorization,
      scope: Scopes.All,
    } as S.Schema.Type<typeof DataAuthorization>)
  } else if (topLevelScope.value === 'some') {
    for (const agent of Object.values(agentsIndex)) {
      const agentAuthorization = {
        ...accessNeedAuthorization,
        dataOwner: agent.id,
      }
      if (agent.scope === 'all') {
        dataAuthorizations.push({
          ...agentAuthorization,
          scope: Scopes.AllFromAgent,
        } as S.Schema.Type<typeof DataAuthorization>)
      } else if (agent.scope === 'some') {
        for (const registration of findAgentRegistrations(agent.id)) {
          const registrationAuthorization = {
            ...agentAuthorization,
            dataRegistration: registration.id,
          } as Partial<S.Schema.Type<typeof DataAuthorization>>
          if (registration.scope === 'all') {
            dataAuthorizations.push({
              ...registrationAuthorization,
              scope: Scopes.AllFromRegistry,
            } as S.Schema.Type<typeof DataAuthorization>)
          } else if (registration.scope === 'some') {
            dataAuthorizations.push({
              ...registrationAuthorization,
              scope: Scopes.SelectedFromRegistry,
              dataInstances: findRegistrationDataInstances(registration.id)
                .filter((i) => i.selected)
                .map((i) => i.id),
            } as unknown as S.Schema.Type<typeof DataAuthorization>)
          }
        }
      }
    }
  }
  let children: S.Schema.Type<typeof DataAuthorization>[] = []
  if (need.children) {
    children = need.children.flatMap((childAccessNeed) =>
      createDataAuthorizations(childAccessNeed, need)
    )
  }
  return [...dataAuthorizations, ...children]
}

function authorize(granted = true) {
  // UI also disables the authorize button
  if (granted && topLevelScope.value === 'none') {
    throw new Error('Use granted = false if no data is being shared')
  }
  loadingAuthorize.value = granted
  loadingDeny.value = !granted
  if (props.authorizationData) {
    let authorization: S.Schema.Type<typeof Authorization>
    const baseAuthorization = {
      grantee: props.authorizationData.id,
      agentType: props.agent ? AgentType.SocialAgent : AgentType.Application,
      accessNeedGroup: props.authorizationData.accessNeedGroup.id,
    } as S.Schema.Type<typeof BaseAuthorization>
    if (granted) {
      authorization = {
        ...baseAuthorization,
        dataAuthorizations: props.authorizationData.accessNeedGroup.needs.flatMap((need) =>
          createDataAuthorizations(need)
        ),
        granted: true,
      }
    } else {
      authorization = {
        ...baseAuthorization,
        granted: false,
      }
    }
    //@ts-ignore
    if (granted && !authorization.dataAuthorizations?.length) {
      throw new Error('Use granted = false if no data is being shared')
    }
    appStore.authorizeApp(authorization)
  }
}

watch(
  () => appStore.accessAuthorization,
  (accessAuthorization) => {
    if (accessAuthorization) {
      if (props.redirect) {
        window.location.href = accessAuthorization.callbackEndpoint
      } else if (props.authorizationData.agentType === AgentType.SocialAgent) {
        router.push({ name: 'social-agent-list' })
      } else {
        router.push({ name: 'application-list' })
      }
    }
  }
)
</script>

<style>
#panel-hell .v-expansion-panel-text__wrapper {
  padding: 8px 0px 16px;
}

#panel-hell .v-expansion-panel-title {
  padding: 16px 16px;
}

span.label {
  padding-left: 6px;
}
</style>
