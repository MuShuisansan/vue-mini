class MVue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;
    this.observer(this.$data);

    // new Watcher();
    // this.$data.test;
    // new Watcher();
    // this.$data.person.name;
    // new Watcher();
    // this.$data.person.age;
    // console.log('模拟render， 触发test的getter', this._data.test);

    new Compile(options.el, this);
    // created执行
    if (options.created) {
      options.created.call(this);
    }
  }
  observer(value) {
    if (!value || typeof value !== 'object') {
      return;
    }
    Object.keys(value).forEach(key => {
      this.defineReactive(value, key, value[key]);
      // 代理data中的属性到vue 实例上
      this.proxyData(key);
    })
  }

  // 数据的响应化
  defineReactive(obj, key, val) {
    // this.observer(val); // 解决数据嵌套

    const dep = new Dep();
    Object.defineProperty(obj, key, {
      enumerable: true,
      /**可枚举性 */
      configurable: true,
      /**属性可被修改或者删除 */
      get() {
        // 将Dep.target（当前的watcher对象存入Dep的deps中）
        Dep.target && dep.addDep(Dep.target)
        return val;
      },
      set(newVal) {
        if (newVal == val) return;
        val = newVal
        // 在set的时候触发dep的notify来通知所有的Watcher对象更新视图
        dep.notify()
      }
    })
  }
  proxyData(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key]
      },
      set(newVal) {
        this.$data[key] = newVal;
      }
    })
  }
}


// 依赖收集
class Dep {
  constructor() {
    // 存储所有依赖
    this.deps = [];
  }
  addDep(dep) {
    this.deps.push(dep);
  }
  // 通知所有监听去更新视图
  notify() {
    this.deps.forEach(dep => {
      dep.update()
    })
  }
}

class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb
    // 在new一个监听器的同时将该对象赋值给Dep.target, 在get中会用到
    Dep.target = this;
    this.vm[this.key]; // 触发getter 添加依赖
    Dep.target = null;
  }
  update() {
    // console.log('视图更新', this.vm)
    this.cb.call(this.vm, this.vm[this.key])
  }
}