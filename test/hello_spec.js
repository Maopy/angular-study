import { sayHello } from '../src/hello'

describe('Hello', () => {
  it('says hello', () => {
    expect(sayHello())
      .toBe('hello, world')
  })
})
