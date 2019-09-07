module.exports = {
  scopes: [],
  types: [
    {
      value: 'build',
      name: 'build:     Build process or auxiliary tool changes',
    },
    {
      value: 'chore',
      name: 'chore:     Other, no production code change',
    },
    {
      value: 'ci',
      name: 'ci:        CI related changes',
    },
    {
      value: 'docs',
      name: 'docs:      Documentation only changes',
    },
    {
      value: 'feat',
      name: 'feat:      A new feature',
    },
    {
      value: 'fix',
      name: 'fix:       A bug fix',
    },
    {
      value: 'perf',
      name: 'perf:      A code change that improves performance',
    },
    {
      value: 'refactor',
      name: 'refactor:  A code change that neither fixes a bug or adds a feature',
    },
    {
      value: 'style',
      name: 'style:     Markup, white-space, formatting, missing semi-colons, etc.',
    },
    {
      value: 'test',
      name: 'test:      Adding missing tests',
    },
    {
      value: 'release',
      name: 'release:    Create a release commit',
    },
  ],
  allowCustomScopes: true,
  allowBreakingChanges: ['build', 'feat', 'fix'],
  subjectLimit: 72,
};
