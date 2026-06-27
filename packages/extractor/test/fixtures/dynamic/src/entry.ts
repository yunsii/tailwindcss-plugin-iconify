import { eager } from './eager'

export const icons = [
  eager,
  import('./lazy').then((module) => module.lazy),
]
