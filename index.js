/**
 * 微信小程序状态管理
 */
import diff from './utils/diff'
export class WxStore {
  constructor(p = {}) {
    this.__instance = []; // 挂载store实例的页面、组件
    this.__data = clone(p.data) || {}; // 状态
    this.__mutations = p.mutations || {}; // 改变状态方法
    this.__actions = p.actions || {}; // 行为
    this.__dataMap = {}; // 数据与实例数据名称映射关系
    this.__dataMirror = null // 镜像数据避免直接对__data修改
  }
  /**
   * 根据路径写入数据
   * @param {*} oData 原数据
   * @param {*} keys 修改数据key值数组
   * @param {*} val 传入的值
   */
  _assignObj(oData, keys, val) {
    for (var i = 0; i < keys.length - 1; i++) {
      if (checkType(oData[keys[i]], ['Array']) && isNaN(keys[i + 1])) {
        oData[keys[i]] = {}
      } else if (!checkType(oData[keys[i]], ['Array', 'Object'])) {
        oData[keys[i]] = isNaN(keys[i + 1]) ? {} : []
      }
      oData = oData[keys[i]]
    }
    oData[keys[i]] = val
  }
  /**
   * 对选择data、actions、mutations对象映射处理
   * @param {*} s 映射对象、数组
   * @param {*} fn 中间处理函数
   */
  _map(s, fn) {
    let obj = null;
    if (checkType(s, ['Array', 'Object'])) {
      obj = {};
      for (let key in s) {
        if (checkType(s[key], ['String']) && isNaN(s[key])) {
          const dkey = checkType(key, ['String']) && isNaN(key) ? key : s[key];
          const val = fn && fn(s[key], dkey);
          val !== undefined && (obj[dkey] = val)
        } else if (checkType(s[key], ['Array', 'Object'])) {
          Object.assign(obj, this._map(s[key], fn))
        }
      }
    }
    return obj
  }
  /**
   * 获取指定store指定data
   * @param {*} p Object || Array
   * @param {*} cb 回调方法，返回对应
   */
  _mapData(p, cb) {
    let map = {}
    const data = this._map(p, (sKey, dKey) => {
      map[sKey] = dKey;
      if (this.__data[sKey] === undefined) {
        console.error(new Error(`data[${sKey} is undefined]`), this);
        return
      }
      return this.__data[sKey]
    })
    cb && cb(data, map);
    return data
  }
  /**
   * 获取页面组件datamap
   * @param {*} I 页面、组件实例
   */
  _getDataMap(I) {
    const id = `wx_${I.__wxExparserNodeId__}`;
    this.__dataMap[id] = this.__dataMap[id] || {};
    return this.__dataMap[id]
  }
  /**
   * 移除datamap
   * @param {*} I 页面、组件实例
   */
  _removeDataMap(I) {
    const id = `wx_${I.__wxExparserNodeId__}`;
    delete this.__dataMap[id]
  }
  /**
   * 节流设置data
   * @param {*} I 页面、组件实例
   */
  _update(I) {
    Promise.resolve().then(() => {
      I.setData(I.__diffData);
      I.__diffData = {};
      I.__timer = null
    })
  }
  /**
   * 初始化转态数据
   * @param {*} p 页面、组件初始化参数
   * @param {*} I 页面、组件实例
   */
  _init(p, I) {
    I.__diffData = I.__diffData || {};
    let dataMap = this._getDataMap(I);
    if (checkType(p.bindData, ['Array', 'Object'])) {
      this._mapData(p.bindData, (data, map) => {
        Object.assign(dataMap, map);
        !this.__instance.includes(I) && this.__instance.push(I);
        if (data) {
          Object.assign(I.__diffData, data)
          this._update(I)
        }
      })
    } else if (checkType(p.bindData, ['Function'])) {
      p.bindData = p.bindData();
      this._init(p, I)
    } else {
      console.error(new Error(`bindData is not object`), this)
    }
  }
  /**
   * 断开store链接
   * @param {*} I 页面、组件实例
   */
  _detach(I) {
    let index = this.__instance.indexOf(I);
    index > -1 && this.__instance.splice(index, 1);
    this._removeDataMap(I)
  }
  /**
   * 镜像数据
   */
  _dataMirror() {
    this.__dataMirror = this.__dataMirror || clone(this.__data)
    Promise.resolve().then(() => {
      this.__dataMirror = null
    })
    return this.__dataMirror
  }
  /**
   * 绑定其他store
   * @param { [store, bindData] } list 绑定的Store
   * @param {*} I 页面、组件实例
   */
  bindStores(list, I) {
    if (checkType(list, ['Array'])) {
      if (checkType(list[0], ['Array', 'Object'])) {
        const item = list.shift();
        const store = item[0] || item.store;
        const bindData = item[1] || item.bindData;
        store && store._init && store._init({
          bindData
        }, I)
        this.bindStores(list, I)
      }
    } else {
      console.error(new Error(`bindStores is not Array`), this)
    }
  }
  /**
   * 设置状态
   * @param {*} data 设置数据
   */
  setData(data) {
    if (checkType(data, ['Object'])) {
      this.__instance.forEach((I, index) => {
        let needUpdate = false;
        let pre = {};
        let current = {};
        let dataMap = this._getDataMap(I);
        for (let k in data) {
          if (this.__data[k] !== undefined) {
            if (dataMap[k] !== undefined) {
              needUpdate = true;
              pre[dataMap[k]] = I.data[dataMap[k]];
              current[dataMap[k]] = data[k]
            }
            !index && (this.__data[k] = data[k])
          } else {
            let keys = k.match(/[^\[|\]|\.]+/g);
            if (this.__data[keys[0]] !== undefined && keys.length > 1) {
              if (dataMap[keys[0]] !== undefined) {
                needUpdate = true;
                I.__diffData[k] = data[k]
              }
              !index && this._assignObj(this.__data, keys, data[k])
            }
          }
        }
        Object.assign(I.__diffData, diff(current, pre))
        if (needUpdate) {
          this._update(I)
        }
      });
    } else {
      console.error(new Error(`setData params should object`), this)
    }
  }
  /**
   * 执行 mutation
   * @param {*} type mutation名
   * @param {*} payload 传输数据
   */
  commit(type, payload) {
    if (checkType(type, ['String']) && checkType(this.__mutations[type], ['Function'])) {
      this.__mutations[type]({
        data: this._dataMirror(),
        payload,
        setData: this.setData.bind(this)
      })
    } else {
      console.error(new Error(`mutations["${type}"] is undefined`), this)
    }
  }
  /**
   * 执行 action
   * @param {*} type action名
   * @param {*} payload 传输数据
   */
  dispatch(type, payload) {
    if (checkType(type, ['String']) && checkType(this.__actions[type], ['Function'])) {
      this.__actions[type]({
        data: this._dataMirror(),
        payload,
        commit: this.commit.bind(this)
      })
    } else {
      console.error(new Error(`actions["${type}"] is undefined`), this)
    }
  }
  /**
   * 获取指定mutation对象
   * @param {*} p Object || Array
   */
  mapMutations(p) {
    return this._map(p, (sKey) => {
      if (!checkType(this.__mutations[sKey], ['Function'])) {
        console.error(new Error(`mutations[${sKey}] is undefined`), this);
        return
      }
      return (e) => {
        this.commit(sKey, e)
      }
    })
  }
  /**
   * 获取指定Action对象
   * @param {*} p Object || Array
   */
  mapActions(p) {
    return this._map(p, (sKey) => {
      if (!checkType(this.__actions[sKey], ['Function'])) {
        console.error(new Error(`actions[${sKey}] is undefined`), this);
        return
      }
      return (e) => {
        this.dispatch(sKey, e)
      }
    })
  }
}
/**
 * 挂载状态管理
 * @param {*} store 状态管理器
 * @param {*} target 挂载目标组件页面
 */
function attachStore(store, target) {
  target._store = store;
  store.bindStores([...(target.bindStores || [])], target);
  store._init({
    bindData: target.bindData || {}
  }, target);
  Object.assign(target, store.mapActions(target.mapActions), store.mapMutations(target.mapMutations))
}
/**
 * 校验数据类型
 * @param {*} val 数据
 * @param {'String','Number','Boolean','Null','Undefined','Array','Object','Function'} types 匹配类型数组
 */
function checkType(val, types = []) {
  let result = false;
  let t = Object.prototype.toString.call(val);
  let i = 0;
  while (i < types.length) {
    if (t === `[object ${types[i]}]`) {
      result = true;
      break
    }
    i++
  }
  return result
}
/**
 * 克隆对象
 * @param {*} Obj 克隆对象
 */
export function clone(Obj) {
  let buf;
  if (checkType(Obj, ['Array'])) {
    buf = []; // 创建一个空的数组
    let i = Obj.length;
    while (i--) {
      buf[i] = clone(Obj[i]);
    }
    return buf;
  } else if (checkType(Obj, ['Array', 'Object'])) {
    buf = {}; // 创建一个空对象
    for (let k in Obj) { // 为这个对象添加新的属性
      buf[k] = clone(Obj[k]);
    }
    return buf
  } else {
    return Obj
  }
}
/**
 * 组件中获取当前page
 * @param {*} I 页面、组件实例
 */
export function getCurrentPage(I) {
  const pageId = I.getPageId();
  const pages = getCurrentPages();
  for (let i = 0; i < pages.length; i++) {
    if (pageId === pages[i].getPageId()) {
      return pages[i]
    }
  }
}
/**
 * 页面初始化状态
 * @param {*} p 页面初始化参数
 */
export function StorePage(p) {
  const onLoad = p.onLoad,
    onUnload = p.onUnload;
  p.onLoad = function () {
    attachStore(new WxStore(p.store), this);
    this.queueComponents.forEach((component) => {
      attachStore(this._store, component)
    });
    delete this.queueComponents
    onLoad && onLoad.apply(this, arguments)
  }
  p.onUnload = function () {
    this._store && this._store._detach(this);
    onUnload && onUnload.apply(this, arguments)
  }
  Page(p)
}
/**
 * 组件初始化状态
 * @param {*} p 组件初始化参数
 */
export function StoreComponent(p) {
  const attached = p.attached,
    detached = p.detached;
  p.attached = function () {
    const {
      bindData,
      bindStores,
      mapActions,
      mapMutations
    } = p;
    Object.assign(this, {
      bindData,
      bindStores,
      mapActions,
      mapMutations
    });
    const currentPage = getCurrentPage(this);
    if (currentPage._store) {
      attachStore(currentPage._store, this);
      attached && attached.apply(this, arguments)
    } else {
      currentPage.queueComponents = currentPage.queueComponents || [];
      currentPage.queueComponents.push(this);
      attached && attached.apply(this, arguments)
    }
  }
  p.detached = function () {
    this._store && this._store._detach(this);
    detached && detached.apply(this, arguments)
  }
  Component(p)
}