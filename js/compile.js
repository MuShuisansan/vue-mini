// 用法 new Compile(el, vm)
class Compile {
  constructor(el, vm) {
    // 遍历宿主节点
    this.$el = document.querySelector(el);
    this.$vm = vm;

    // 开始编译
    if (this.$el) {
      // 转换内部元素为片段 Fragment
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译
      this.compile(this.$fragment);
      // 将编译完的html结果追加到$el
      this.$el.appendChild(this.$fragment);
    }
  }
  node2Fragment(el) {
    const frag = document.createDocumentFragment();
    // 将el中的所有元素搬家到frag中
    let child;
    while ((child = el.firstChild)) {
      frag.appendChild(child)
    }
    return frag;
  }
  // 编译过程
  compile(el) {
    const childNodes = el.childNodes;
    console.log(el)
    Array.from(childNodes).forEach(node => {
      // 类型判断
      if (this.isElement(node)) {
        // 元素
        // console.log('元素', node.nodeName)
        // 查找 k-, @
        const nodeAttrs = node.attributes;
        Array.from(nodeAttrs).forEach(attr => {
          console.log(attr)
          const attrName = attr.name; // 属性名
          const exp = attr.value; // 属性值
          if (this.isDirective(attrName)) {
            let dir = attrName.substring(2) // text
            //普通指令
            this[dir] && this[dir](node, this.$vm, exp)
          }
          if (this.isEvent(attrName)) {
            let dir = attrName.substring(1) // click
            this.eventHandler(node, this.$vm, exp, dir)
          }
        })
      } else if (this.isInterpolation(node)) {
        // 文本
        // console.log('文本', node.textContent)
        this.compileText(node);
      }

      // 递归节点
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node);
      }
    })
  }
  compileText(node) {
    this.update(node, this.$vm, RegExp.$1, 'text');
  }
  text(node, vm, exp) {
    this.update(node, vm, exp, 'text');
  }
  html(node, vm, exp) {
    this.update(node, vm, exp, 'html');
  }
  model(node, vm, exp) {
    this.update(node, vm, exp, 'model');
    node.addEventListener('input', e => {
      vm[exp] = e.target.value;
    })
  }

  // 更新函数
  update(node, vm, exp, dir) {
    const updaterFn = this[dir + 'Updater'];
    // 初始化
    updaterFn && updaterFn(node, vm[exp])
    // 依赖收集
    new Watcher(vm, exp, function (value) {
      console.log('更新', value)
      updaterFn && updaterFn(node, value)
    })
  }
  modelUpdater(node, value) {
    node.value = value;
  }
  textUpdater(node, value) {
    node.textContent = value;
  }
  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  eventHandler(node, vm, exp, dir) {
    //   事件处理器
    //   @click="onClick"
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }
  isDirective(attrName) {
    return attrName.indexOf("k-") === 0;
  }
  isEvent(attrName) {
    return attrName.indexOf("@") === 0;
  }
  isElement(node) {
    return node.nodeType === 1;
  }
  // 插值文本
  isInterpolation(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }
}