# `client`

Client library to help application integrate and co-exist in an interoperable ecosystem as defined in {{spec url/primer url}}. If provides asynchronous operations via native promises.

## Installation
```npm install -S @scope/package-name```


## Note
Virtual/physical nesting is not properly addresssed in this document. It's possible for a server to assign an
arbitrary resource name to what is being PUT/POST'ed and might result in breaking the references from
one shapetree instance to another, be it a virtual relation or a containment one. This might be addressed
with partial updates where the shapetrees are slowly build in chunks. However the number of HTTP calls
needed would grow exponentially.

## Usage

### Initialization
The application will check if it is already registered (probe the registry via hash) or create a new registration if none


NOTE: After login note
```typescript
import { Client } from '@solid-interop/client'
import { fetch } from '@inrupt/solid-client-authn-browser'

const client = new Client(fetch);
if (!await client.checkRegistration()) {
    // The user will be redirected to their authorization agent of preference to
    // register this application
    client.requestRegistration();
} else {
    // Blockingly browse the pod/pods discovering the different registrations
    // TODO(angel) It should be possible to unblockingly listen to new data registrations as
    //             they are discovered (a là rxjs.Observable)
    await client.index();
}
```

### Getting data
After the application has been registered and access to data has been granted
```typescript
client.getAll(shapetree).then((values: RDFJS.Dataset) => {
    // Parse, store, or manipulate the values. e.g.:
    for (const value of values) {
        const condition = utils.parseIntoMedicalCondition(value);
        storageUtility.storeCondition(condition);
    }
});
```

TODO: add options to pull data from specific registries

### Saving data

Saving data can be done in a general way through the shapetree, in which case the lib
will choose chose any suitable registration or via registration in which case the user
can specify a singular registration to use.

Also the option to insert 1-by-1 or batching through an array is possible. Each entry should correspond
to a single instance of a shapetree

TODO: It might be more useful take something from rxjs and get a signal for each correctly created
shapetree. That way if a multi-shapetree request is not met half way then we can try to backtack the
changes or at least know which was the last succesful resource being created.
```typescript
client.create(shapetree | registration, dataset | dataset[])
    .then(() => console.log('data saved'))
    .catch(e => console.log(`error saving data: ${e}`));

```

Updating a resource is similar, with the difference that we have a reference to an specific data
instances being updated.
```typescript
client.update(instanceUrl, dataset)
    .then(() => {/* ok */})
    .catch(e => {/* not ok */});
```

### Unregistering application
```typescript
client.unregister()
    .then(() => {/* log out of application?*/})
    .catch(() => {/* handle error */});
```
