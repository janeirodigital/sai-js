export default {
  agents: ['https://acme.pod.docker/profile/card#me', 'https://yoyo.pod.docker/profile/card#me'],
  pods: {
    'https://acme.pod.docker/profile/card#me': [
      {
        id: 'https://acme-hr.pod.docker/',
        name: 'HR',
      },
      {
        id: 'https://acme-rnd.pod.docker/',
        name: 'RnD',
      },
    ],
    'https://yoyo.pod.docker/profile/card#me': [
      {
        id: 'https://yoyo-eu.pod.docker/',
        name: 'EU',
      },
    ],
  },
  registrations: {
    'https://acme-hr.pod.docker/': 'https://acme-hr.pod.docker/dataRegistry/events/',
    'https://acme-rnd.pod.docker/': 'https://acme-rnd.pod.docker/dataRegistry/events/',
    'https://yoyo-eu.pod.docker/': 'https://yoyo-eu.pod.docker/dataRegistry/events/',
  },
}
