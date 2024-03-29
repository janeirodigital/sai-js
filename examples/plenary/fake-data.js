export default {
  agents: [
    'http://localhost:3000/acme/profile/card#me',
    'http://localhost:3000/yoyo/profile/card#me'
  ],
  pods: {
    'http://localhost:3000/acme/profile/card#me': [
      {
        id: 'http://localhost:3000/acme-hr/',
        name: 'HR'
      },
      {
        id: 'http://localhost:3000/acme-rnd/',
        name: 'RnD'
      }
    ],
    'http://localhost:3000/yoyo/profile/card#me': [
      {
        id: 'http://localhost:3000/yoyo-eu/',
        name: 'EU'
      },
    ]
  },
  registrations: {
    'http://localhost:3000/acme-hr/': 'http://localhost:3000/acme-hr/dataRegistry/events/',
    'http://localhost:3000/acme-rnd/': 'http://localhost:3000/acme-rnd/dataRegistry/events/',
    'http://localhost:3000/yoyo-eu/': 'http://localhost:3000/yoyo-eu/dataRegistry/events/'
  }
}
