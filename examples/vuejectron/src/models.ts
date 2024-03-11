import { Task as LdoTask } from '../ldo/Task$.typings';

export interface Agent {
  id: string;
  label: string;
}

export interface Project {
  id: string;
  label: string;
  owner: string;
  registration: string;
  canUpdate?: boolean;
  canAddTasks?: boolean;
  canAddImages?: boolean;
  canAddFiles?: boolean;
}

export interface Registration {
  id: string;
  label: string;
  owner: string;
  canCreate?: boolean;
}

export interface Task {
  id: string;
  data: LdoTask;
  project: string;
  owner: string;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export interface FileInstance {
  id: string;
  filename?: string;
  project: string;
  owner: string;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export interface ImageInstance extends FileInstance {}
