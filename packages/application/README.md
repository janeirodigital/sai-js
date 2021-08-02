# Application

## Example

```ts
import { DatasetCore } from '@rdfjs/types';
import { Application } from 'interop-application';
import { DataInstance } from 'interop-data-model';
import { fetch } from 'solid-auth-fetcher';
import { randomUUID } from 'crypto';
import { N3Store } from 'n3';

class Project {
  localDataset: DatasetCore;

  constructor(private dataInstance: DataInstance) {
    this.localDataset = new N3Store([...dataInstance.dataset]);
  }

  delete(): Promise<void> {
    return this.dataInstance.delete();
  }

  update(): Promise<void> {
    return this.dataInstance.update(this.localDataset);
  }

  get dataset(): DatasetCore {
    return this.dataInstance.dataset;
  }

  set name(name: string): void {
    // manipulate this.localDataset to change project name
  }

  static shapeTree = 'https://solidshapes.example/trees/Project';
}

(async function () {
  // log in user with solid-auth-fetcher
  // TODO (elf-pavlik) add  log in example

  // create new application
  // fetch will include webid of logged in user
  const application = await Application.build({ fetch, randomUUID });

  // application provides list of all data owners
  // application.dataOwners

  // as well as convienience getter for currently logged in user
  const user = application.loggedInDataOwner;

  const projects = [];
  // agent has issued one or more source grants
  for (const sourceGrant of user.grantsForShapeTree(Project.shapeTree)) {
    // each grant maps to one data registration
    // grant provides async iterator to Data Instances from that data registration
    for await (const dataInstance of sourceGrant.getDataInstanceIterator()) {
      // data instance will provide RDFJS DatasetCore with all the data
      // one can create app specific instances
      projects.push(new Project(dataInstance));
    }
  }

  // DataInstance#delete
  const projectToDelete = projects.find(/* logic */);
  try {
    await projectToDelete.delete();
  } catch (e) {
    // handle error
  }

  // DataInstance#update
  const projectToUpdate = projects.find(/* logic */);
  projectToUpadate.name = 'Very very important thing';
  try {
    await projectToUpdate.update();
  } catch (e) {
    // handle error
  }

  // DataRegistration#newDataInstance
  const grantForSpecificRegistration = user.grantsForShapeTree(projectShapeTree).find(/* logic */);
  if (grantForSpecificRegistration.canCreate) {
    const newProject = grantForSpecificRegistration.newDataInstance();
    newProject.name = 'Another thing';
    try {
      await newProject.update();
    } catch (e) {
      // handle error
    }
  }

  // also data instance acting as parent provides convienience method
  const projectToCreateTaskIn = projects.find(/* logic */);
  const newTask = new Task(projectToCreateTaskIn.newChildInstance(Task.shapeTree));
  task.name = 'some TODO';
  try {
    await newTask.update();
  } catch (e) {
    // handle error
  }
})();
```
