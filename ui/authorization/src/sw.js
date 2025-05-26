self.addEventListener('push', (event) => {
  // show notification
  self.registration.showNotification('SAI Auth', {
    body: event.data.json().notification.body,
  })

  // send to all clients
  self.clients.matchAll().then((clientList) => {
    for (const client of clientList) {
      client.postMessage(event.data.json().notification)
    }
  })
})

// TODO: handle messages from clients
// self.addEventListener('message', () => {})
