self.addEventListener('push', (event) => {

  // show notification
  event.waitUntil(
    self.registration.showNotification(event.data.json().notification.type, {
      body: event.data.json().notification.object
    })
  )

  // send to all clients
  self.clients.matchAll().then((clientList) => {
    for (const client of clientList) {
      client.postMessage(event.data.json())
    }
  });

});

// TODO: handle messages from clients
self.addEventListener('message', () => {
})
