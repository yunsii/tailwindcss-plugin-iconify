export const routerDemos = {
  app: {
    title: 'Next.js App Router',
    href: '/docs/app',
    previewUrl: 'http://127.0.0.1:3001',
    examplePath: 'examples/next-app-router',
    catalogPath: 'examples/next-app-router/.iconcat/catalog.json',
    command: 'pnpm --filter @iconcat/example-next-app-router run extract',
    buildCommand: 'pnpm run build',
    entries: [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/app/dashboard/page.tsx',
      'src/app/settings/page.tsx',
    ],
  },
  pages: {
    title: 'Next.js Pages Router',
    href: '/docs/pages',
    previewUrl: 'http://127.0.0.1:3002',
    examplePath: 'examples/next-pages-router',
    catalogPath: 'examples/next-pages-router/.iconcat/catalog.json',
    command: 'pnpm --filter @iconcat/example-next-pages-router run extract',
    buildCommand: 'pnpm run build',
    entries: [
      'src/pages/_app.tsx',
      'src/pages/index.tsx',
      'src/pages/dashboard/index.tsx',
      'src/pages/settings/index.tsx',
    ],
  },
  reactRouter: {
    title: 'React Router',
    href: '/docs/react-router',
    previewUrl: 'http://127.0.0.1:5173',
    examplePath: 'examples/react-router-vite',
    catalogPath: 'examples/react-router-vite/.iconcat/catalog.json',
    command: 'pnpm --filter @iconcat/example-react-router-vite run extract',
    buildCommand: 'vite build # iconcat runs from the Vite build plugin',
    entries: [
      'src/App.tsx',
      'src/main.tsx',
    ],
  },
}

export type RouterDemoKey = keyof typeof routerDemos
