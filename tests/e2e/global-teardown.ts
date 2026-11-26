import { e2eData } from './support/data'

export default function globalTeardown() {
  e2eData('teardown')
}
