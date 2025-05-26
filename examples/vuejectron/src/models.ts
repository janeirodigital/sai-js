export interface Agent {
  id: string
  label: string
}

export interface ResourceServer {
  id: string
  label: string
  owner: string
  canCreate?: boolean
}
