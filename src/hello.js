import { template } from 'lodash-es'

export function sayHello (to) {
  return template('Hello, <%= name %>!')({ name: to })
}
