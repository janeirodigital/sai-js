const icons = {
  Update:
    'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M5%2C3C3.89%2C3%203%2C3.89%203%2C5V19A2%2C2%200%200%2C0%205%2C21H19A2%2C2%200%200%2C0%2021%2C19V12H19V19H5V5H12V3H5M17.78%2C4C17.61%2C4%2017.43%2C4.07%2017.3%2C4.2L16.08%2C5.41L18.58%2C7.91L19.8%2C6.7C20.06%2C6.44%2020.06%2C6%2019.8%2C5.75L18.25%2C4.2C18.12%2C4.07%2017.95%2C4%2017.78%2C4M15.37%2C6.12L8%2C13.5V16H10.5L17.87%2C8.62L15.37%2C6.12Z%22%20%2F%3E%3C%2Fsvg%3E',
}

self.addEventListener('push', (event) => {
  const notification = event.data.json()

  // show notification
  event.waitUntil(
    self.registration.showNotification(notification.label || notification.object, {
      icon: icons[notification.type],
    })
  )

  // send to all clients
  self.clients.matchAll().then((clientList) => {
    for (const client of clientList) {
      client.postMessage(notification)
    }
  })
})

// TODO: handle messages from clients
// self.addEventListener('message', () => {})
