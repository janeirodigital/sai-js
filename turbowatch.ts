import path from 'node:path'
import { watch } from 'turbowatch'

function npmName(pkgName: string) {
  if (pkgName === 'api-messages') {
    return '@janeirodigital/sai-api-messages'
  }
  return `@janeirodigital/interop-${pkgName}`
}

// TODO watch service componentjs configs

const packages = ['utils', 'data-model', 'application', 'authorization-agent', 'api-messages']
for (const pkgName of packages) {
  void watch({
    project: path.join(__dirname, `packages/${pkgName}`),
    triggers: [
      {
        expression: ['allof', ['not', ['dirname', 'node_modules']], ['match', '*.ts', 'basename']],
        name: 'build',
        onChange: async ({ spawn }) => {
          await spawn`pnpm turbo run build --filter=${npmName(pkgName)}`
        },
      },
    ],
  })
}

void watch({
  project: path.join(__dirname, 'packages/service'),
  triggers: [
    {
      expression: [
        'anyof',
        ['allof', ['dirname', 'node_modules'], ['dirname', 'dist'], ['match', '*', 'basename']],
        [
          'allof',
          ['not', ['dirname', 'node_modules']],
          ['dirname', 'src'],
          ['match', '*', 'basename'],
        ],
      ],
      // Because of this setting, Turbowatch will kill the processes that spawn starts
      // when it detects changes when it detects a change.
      interruptible: true,
      name: 'start-server',
      onChange: async ({ spawn }) => {
        await spawn`pnpm --filter=@janeirodigital/sai-server debug`
      },
    },
  ],
})
