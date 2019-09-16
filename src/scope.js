import { forEach, forEachRight, isEqual, cloneDeep } from 'lodash-es'

function initWatchVal () {}

export default class Scope {
  constructor () {
    this.$$watchers = []
    this.$$lastDirtyWatch = null
    this.$$asyncQueue = []
    this.$$phase = null
  }

  $beginPhase (phase) {
    if (this.$$phase) {
      throw new Error(`${this.$$phase} already in progress.`)
    }
    this.$$phase = phase
  }

  $clearPhase () {
    this.$$phase = null
  }

  $eval (expr, locals) {
    return expr(this, locals)
  }

  $apply (expr) {
    try {
      this.$beginPhase('$apply')
      return this.$eval(expr)
    } finally {
      this.$clearPhase()
      this.$digest()
    }
  }

  $evalAsync (expr) {
    if (!this.$$phase && !this.$$asyncQueue.length) {
      setTimeout(() => {
        if (this.$$asyncQueue.length) {
          this.$digest()
        }
      }, 0)
    }
    this.$$asyncQueue.push({ scope: this, expression: expr })
  }

  $watch (watchFn, listenerFn, valueEq) {
    const watcher = {
      watchFn,
      listenerFn: listenerFn || function () {},
      valueEq: !!valueEq,
      last: initWatchVal
    }
    this.$$watchers.unshift(watcher)
    this.$$lastDirtyWatch = null

    return () => {
      const index = this.$$watchers.indexOf(watcher)
      if (index >= 0) {
        this.$$watchers.splice(index, 1)
        this.$$lastDirtyWatch = null
      }
    }
  }

  $digest () {
    let ttl = 10
    let dirty
    this.$$lastDirtyWatch = null
    this.$beginPhase('$digest')
    do {
      while (this.$$asyncQueue.length) {
        const asyncTask = this.$$asyncQueue.shift()
        asyncTask.scope.$eval(asyncTask.expression)
      }
      dirty = this.$$digestOnce()
      if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
        this.$clearPhase()
        throw new Error('10 digest iterations reached')
      }
    } while (dirty || this.$$asyncQueue.length)
    this.$clearPhase()
  }

  $$digestOnce () {
    let newValue, oldValue, dirty
    forEachRight(this.$$watchers, (watcher) => {
      try {
        if (watcher) {
          newValue = watcher.watchFn(this)
          oldValue = watcher.last
          if (!this.$$areEqual(newValue, oldValue, watcher.valueEq)) {
            this.$$lastDirtyWatch = watcher
            watcher.last = (watcher.valueEq ? cloneDeep(newValue) : newValue)
            watcher.listenerFn(newValue,
              oldValue === initWatchVal ? newValue : oldValue,
              this)
            dirty = true
          } else if (this.$$lastDirtyWatch === watcher) {
            return false
          }
        }
      } catch (e) {
        console.error(e)
      }
    })
    return dirty
  }

  $$areEqual (newValue, oldValue, valueEq) {
    if (valueEq) {
      return isEqual(newValue, oldValue)
    } else {
      return newValue === oldValue ||
        (typeof newValue === 'number' && typeof oldValue === 'number' &&
          isNaN(newValue) && isNaN(oldValue))
    }
  }
}
