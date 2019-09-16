/* global describe, it, expect, beforeEach, jasmine */
import { range, times } from 'lodash-es'
import Scope from '../src/scope'

describe('Scope', () => {
  it('can be constructed and used as an object', () => {
    const scope = new Scope()
    scope.aProperty = 1

    expect(scope.aProperty).toBe(1)
  })

  describe('digest', () => {
    let scope

    beforeEach(() => {
      scope = new Scope()
    })

    it('calls the listener function of a watch on first $digest', () => {
      const watchFn = () => 'wat'
      const listenerFn = jasmine.createSpy()

      scope.$watch(watchFn, listenerFn)
      scope.$digest()

      expect(listenerFn).toHaveBeenCalled()
    })

    it('call the watch function with the scope as the argument', () => {
      const watchFn = jasmine.createSpy()
      const listenerFn = () => {}

      scope.$watch(watchFn, listenerFn)
      scope.$digest()

      expect(watchFn).toHaveBeenCalledWith(scope)
    })

    it('calls the listener function when the watched value changes', () => {
      scope.someValue = 'a'
      scope.counter = 0

      scope.$watch((scope) => scope.someValue, (newValue, oldValue, scope) => scope.counter++)

      expect(scope.counter).toBe(0)

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.someValue = 'b'
      expect(scope.counter).toBe(1)

      scope.$digest()
      expect(scope.counter).toBe(2)
    })

    it('calls listener when watch value is first undefined', () => {
      scope.counter = 0

      scope.$watch((scope) => scope.someValue, (newValue, oldValue, scope) => scope.counter++)

      scope.$digest()
      expect(scope.counter).toBe(1)
    })

    it('calls listener with new value as old value the first time', () => {
      scope.someValue = 123
      let oldValueGiven

      scope.$watch((scope) => scope.someValue, (newValue, oldValue, scope) => (oldValueGiven = oldValue))

      scope.$digest()
      expect(oldValueGiven).toBe(123)
    })

    it('may have watchers that omit the listener function', () => {
      const watchFn = jasmine.createSpy().and.returnValue('something')
      scope.$watch(watchFn)

      scope.$digest()
      expect(watchFn).toHaveBeenCalled()
    })

    it('trigger chained watchers in the same digest', () => {
      scope.name = 'Jane'

      scope.$watch(
        (scope) => scope.nameUpper,
        (newValue, oldValue, scope) => {
          if (newValue) {
            scope.initial = newValue.substring(0, 1) + '.'
          }
        }
      )
      scope.$watch(
        (scope) => scope.name,
        (newValue, oldValue, scope) => {
          if (newValue) {
            scope.nameUpper = newValue.toUpperCase()
          }
        }
      )

      scope.$digest()
      expect(scope.initial).toBe('J.')

      scope.name = 'Bob'
      scope.$digest()
      expect(scope.initial).toBe('B.')
    })

    it('gives up on the watches after 10 iterations', () => {
      scope.counterA = 0
      scope.counterB = 0

      scope.$watch(
        (scope) => scope.counterA,
        (newValue, oldValue, scope) => scope.counterA++
      )

      expect(() => scope.$digest()).toThrow()
    })

    it('ends the digest when the last watch is clean', () => {
      scope.array = range(100)
      let watchExecutions = 0

      times(100, (i) => {
        scope.$watch(
          (scope) => {
            watchExecutions++
            return scope.array[i]
          },
          (newValue, oldValue, scope) => {}
        )
      })

      scope.$digest()
      expect(watchExecutions).toBe(200)

      scope.array[0] = 420
      scope.$digest()
      expect(watchExecutions).toBe(301)
    })

    it('does not end digest so that new watches are not run', () => {
      scope.aValue = 'abc'
      scope.counter = 0

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(1)
    })

    it('compares based on value if enabled', () => {
      scope.aValue = [1, 2, 3]
      scope.counter = 0

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++,
        true
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.aValue.push(4)
      scope.$digest()
      expect(scope.counter).toBe(2)
    })

    it('correct handles NaNs', () => {
      scope.number = 0 / 0
      scope.counter = 0

      scope.$watch(
        (scope) => scope.number,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.$digest()
      expect(scope.counter).toBe(1)
    })

    it('catches exceptions in watch functions and continues', () => {
      scope.aValue = 'abc'
      scope.counter = 0

      scope.$watch(
        (scope) => { throw new Error('Error') },
        (newValue, oldValue, scope) => {}
      )
      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(1)
    })

    it('catches exceptions in listener functions and continues', () => {
      scope.aValue = 'abc'
      scope.counter = 0

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => { throw new Error('Error') }
      )
      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(1)
    })

    it('allows destroying a $watch with a removal function', () => {
      scope.aValue = 'abc'
      scope.counter = 0

      var destroyWatch = scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.aValue = 'def'
      scope.$digest()
      expect(scope.counter).toBe(2)

      scope.aValue = 'ghi'
      destroyWatch()
      scope.$digest()
      expect(scope.counter).toBe(2)
    })

    it('allows destroying a $watch during digest', () => {
      scope.aValue = 'abc'

      const watchCalls = []

      scope.$watch((scope) => {
        watchCalls.push('first')
        return scope.aValue
      })

      const destroyWatch = scope.$watch((scope) => {
        watchCalls.push('second')
        destroyWatch()
      })

      scope.$watch((scope) => {
        watchCalls.push('third')
        return scope.aValue
      })

      scope.$digest()
      expect(watchCalls)
        .toEqual(['first', 'second', 'third', 'first', 'third'])
    })

    it('allows a $watch to destroy another during digest', () => {
      scope.aValue = 'abc'
      scope.counter = 0

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => destroyWatch()
      )

      const destroyWatch = scope.$watch(
        (scope) => {},
        (newValue, oldValue, scope) => {}
      )

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(1)
    })

    it('allows destroying several $watches during digest', () => {
      scope.aValue = 'abc'
      scope.counter = 0

      const destroyWatch1 = scope.$watch((scope) => {
        destroyWatch1()
        destroyWatch2()
      })

      const destroyWatch2 = scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(0)
    })
  })

  describe('$eval', () => {
    let scope

    beforeEach(() => {
      scope = new Scope()
    })

    it('executes $evaled function and returns result', () => {
      scope.aValue = 42

      const result = scope.$eval((scope) => scope.aValue)

      expect(result).toBe(42)
    })

    it('passes the second $eval argument straight through', () => {
      scope.aValue = 42

      const result = scope.$eval((scope, arg) => scope.aValue + arg, 2)

      expect(result).toBe(44)
    })
  })

  describe('$apply', () => {
    let scope

    beforeEach(() => {
      scope = new Scope()
    })

    it('executes the given function and starts the digest', () => {
      scope.aValue = 'someValue'
      scope.counter = 0

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.$apply((scope) => {
        scope.aValue = 'someOtherValue'
      })
      expect(scope.counter).toBe(2)
    })
  })

  describe('$evalAsync', () => {
    let scope

    beforeEach(() => {
      scope = new Scope()
    })

    it('executes given function later in the same cycle', () => {
      scope.aValue = [1, 2, 3]
      scope.asyncEvaluated = false
      scope.asyncEvaluatedImmediately = false

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.$evalAsync((scope) => {
            scope.asyncEvaluated = true
          })
          scope.asyncEvaluatedImmediately = scope.asyncEvaluated
        }
      )

      scope.$digest()
      expect(scope.asyncEvaluated).toBe(true)
      expect(scope.asyncEvaluatedImmediately).toBe(false)
    })

    it('executes $evalAsynced functions added by watch functions', () => {
      scope.aValue = [1, 2, 3]
      scope.asyncEvaluated = false

      scope.$watch(
        (scope) => {
          if (!scope.asyncEvaluated) {
            scope.$evalAsync((scope) => {
              scope.asyncEvaluated = true
            })
          }
          return scope.aValue
        },
        (newValue, oldValue, scope) => {}
      )

      scope.$digest()

      expect(scope.asyncEvaluated).toBe(true)
    })

    it('executes $evalAsynced functions even when not dirty', () => {
      scope.aValue = [1, 2, 3]
      scope.asyncEvaluatedTimes = 0

      scope.$watch(
        (scope) => {
          if (scope.asyncEvaluatedTimes < 2) {
            scope.$evalAsync((scope) => scope.asyncEvaluatedTimes++)
          }
          return scope.aValue
        },
        (newValue, oldValue, scope) => {}
      )

      scope.$digest()

      expect(scope.asyncEvaluatedTimes).toBe(2)
    })

    it('eventually halts $evalAsyncs added by watches', () => {
      scope.aValue = [1, 2, 3]

      scope.$watch(
        (scope) => {
          scope.$evalAsync((scope) => {})
          return scope.aValue
        },
        (newValue, oldValue, scope) => {}
      )

      expect(() => scope.$digest()).toThrow()
    })

    it('has a $$phase field whose value is the current digest phase', () => {
      scope.aValue = [1, 2, 3]
      scope.phaseInWatchFunction = undefined
      scope.phaseInListenerFunction = undefined
      scope.phaseInApplyFunction = undefined

      scope.$watch(
        (scope) => {
          scope.phaseInWatchFunction = scope.$$phase
          return scope.aValue
        },
        (newValue, oldValue, scope) => {
          scope.phaseInListenerFunction = scope.$$phase
        }
      )

      scope.$apply((scope) => {
        scope.phaseInApplyFunction = scope.$$phase
      })

      expect(scope.phaseInWatchFunction).toBe('$digest')
      expect(scope.phaseInListenerFunction).toBe('$digest')
      expect(scope.phaseInApplyFunction).toBe('$apply')
    })

    it('schedules a digest in $evalAsync', (done) => {
      scope.aValue = 'abc'
      scope.counter = 0

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$evalAsync((scope) => {})

      expect(scope.counter).toBe(0)
      setTimeout(() => {
        expect(scope.counter).toBe(1)
        done()
      }, 50)
    })
  })

  describe('$applyAsync', () => {
    let scope

    beforeEach(() => {
      scope = new Scope()
    })

    it('allows async $apply with $applyAsync', (done) => {
      scope.counter = 0
      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => scope.counter++
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.$applyAsync((scope) => {
        scope.aValue = 'abc'
      })
      expect(scope.counter).toBe(1)

      setTimeout(() => {
        expect(scope.counter).toBe(2)
        done()
      }, 50)
    })

    it('never executes $applyAsynced function in the same cycle', (done) => {
      scope.aValue = [1, 2, 3]
      scope.asyncApplied = false

      scope.$watch(
        (scope) => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.$applyAsync((scope) => {
            scope.asyncApplied = true
          })
        }
      )

      scope.$digest()
      expect(scope.asyncApplied).toBe(false)
      setTimeout(() => {
        expect(scope.asyncApplied).toBe(true)
        done()
      }, 50)
    })
  })
})
