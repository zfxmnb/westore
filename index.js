/**
 * 微信小程序状态管理
 */
export class WxStore {
	constructor(p = {}) {
		this.__instance = []; // 挂载store实例的页面、组件
		this.__data = this._clone(p.data) || {}; // 状态
		this.__mutations = p.mutations || {}; // 改变状态方法
		this.__actions = p.actions || {}; // 行为
		this.__dataMap = {}; // 数据与实例数据名称映射关系
		this.__dataMirror = { // 镜像数据避免直接对__data修改
			timer: null,
			data: null
		}
	}
	/**
	 * 克隆对象
	 * @param {*} Obj 克隆对象
	 */
	_clone(Obj) {
		let buf;
		if (Obj instanceof Array) {
			buf = []; // 创建一个空的数组
			let i = Obj.length;
			while (i--) {
				buf[i] = this._clone(Obj[i]);
			}
			return buf;
		} else if (Obj instanceof Object) {
			buf = {}; // 创建一个空对象
			for (let k in Obj) { // 为这个对象添加新的属性
				buf[k] = this._clone(Obj[k]);
			}
			return buf;
		} else {
			return Obj;
		}
	}
	/**
	 * 格式化对象路径
	 * @param {*} keys 路径数组
	 */
	_fromatObjPath(keys) {
		let key = `${keys[0]}`;
		let arr = keys.slice(1);
		if (arr.length) {
			arr.forEach((k) => {
				if (isNaN(k)) {
					key += `.${k}`
				} else {
					key += `[${k}]`
				}
			})
		}
		return key
	}
	/**
	 * 根据路径写入数据
	 * @param {*} oData 原数据
	 * @param {*} keys 修改数据key值数组
	 * @param {*} val 传入的值
	 */
	_assignObj(oData, keys, val) {
		for (var i = 0; i < keys.length - 1; i++) {
			if (oData[keys[i]] instanceof Array && isNaN(keys[i + 1])) {
				oData[keys[i]] = {}
			} else if (!(oData[keys[i]] instanceof Object)) {
				oData[keys[i]] = isNaN(keys[i + 1]) ? {} : []
			}
			oData = oData[keys[i]]
		}
		oData[keys[i]] = val
	}
	/**
	 * diff 算法
	 * @param {*} oobj 原数据
	 * @param {*} obj 修改数据
	 * @param {*} okeys 修改对象的查找key数组
	 * @param {*} diffObj 生成的计算后的setData数据
	 */
	_diff(oobj = {}, obj = {}, okeys = [], diffObj = {}) {
		for (let k in obj) {
			const keys = okeys.concat([k]);
			if (obj[k] instanceof Object && oobj[k] instanceof Object) {
				this._diff(oobj[k], obj[k], keys, diffObj)
			} else if (obj[k] !== oobj[k]) {
				diffObj[this._fromatObjPath(keys)] = obj[k]
			}
		}
		return diffObj
	}
	/**
	 * 对选择data、actions、mutations对象映射处理
	 * @param {*} s 映射对象、数组
	 * @param {*} fn 中间处理函数
	 */
	_map(s, fn) {
		let obj = null;
		if (typeof s === 'object') {
			obj = {};
			for (let k in s) {
				const dk = isNaN(k) ? k : s[k];
				if (isNaN(dk)) {
					const val = fn && fn(k, dk);
					if (val !== undefined) {
						obj[dk] = val
					}
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
		const data = this._map(p, (k, dk) => {
			map[p[k]] = dk;
			return this.__data[p[k]]
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
		I.__timer && clearTimeout(I.__timer);
		I.__timer = setTimeout(() => {
			I.setData(I.__diffData);
			I.__diffData = {};
			I.__timer = null
		});
	}
	/**
	 * 初始化转态数据
	 * @param {*} p 页面、组件初始化参数
	 * @param {*} I 页面、组件实例
	 */
	_init(p, I) {
		I.__diffData = I.__diffData || {};
		let dataMap = this._getDataMap(I);
		if (typeof p.bindData === 'object') {
			this._mapData(p.bindData, (data, map) => {
				Object.assign(dataMap, map);
				!this.__instance.includes(I) && this.__instance.push(I);
				if (data) {
					Object.assign(I.__diffData, data)
					this._update(I)
				}
			})
		} else if (typeof p.bindData === 'function') {
			p.bindData = p.bindData();
			this._init(p, I)
		} else {
			console.error(new Error(`bindData is not object`))
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
		this.__dataMirror.timer && clearTimeout(this.__dataMirror.timer);
		this.__dataMirror.timer = setTimeout(() => {
			this.__dataMirror.data = this.__dataMirror.timer = null;
		})
		return this.__dataMirror.data || this._clone(this.__data)
	}
	/**
	 * 绑定其他store
	 * @param { Store, bindData } list 绑定的Store
	 * @param {*} I 页面、组件实例
	 */
	bindStores(list, I) {
		if (list instanceof Array) {
			if (list[0]) {
				const item = list.shift();
				if (item && item[0] && item[0]._init) {
					item[0]._init({
						bindData: item[1]
					}, I)
				}
				this.bindStores(list, I)
			}
		} else {
			console.error(new Error(`bindStores is not Array`))
		}
	}
	/**
	 * 设置状态
	 * @param {*} data 设置数据
	 */
	setData(data) {
		if (data instanceof Object) {
			this.__instance.forEach((I, index) => {
				let need = false;
				let newData = {};
				let dataMap = this._getDataMap(I);
				for (let k in data) {
					if (this.__data[k] !== undefined) {
						if (dataMap[k] !== undefined) {
							need = true;
							newData[dataMap[k]] = data[k];
						};
						!index && (this.__data[k] = data[k])
					} else {
						let keys = k.match(/[^\[|\]|\.]+/g);
						if (this.__data[keys[0]] !== undefined && keys.length > 1) {
							if (dataMap[keys[0]] !== undefined) {
								need = true;
								I.__diffData[this._fromatObjPath([...keys])] = data[k];
							};
							!index && this._assignObj(this.__data, keys, data[k])
						}
					}
				}
				Object.assign(I.__diffData, this._diff(I.data, newData))
				if (need) {
					this._update(I)
				}
			});
		} else {
			console.error(new Error(`setData params should object`))
		}
	}
	/**
	 * 执行 mutation
	 * @param {*} type mutation名
	 * @param {*} payload 传输数据
	 */
	commit(type, payload) {
		if (typeof type === 'string' && (typeof this.__mutations[type] === 'function')) {
			this.__mutations[type]({
				data: this._dataMirror(),
				payload,
				setData: this.setData.bind(this)
			})
		} else {
			console.error(new Error(`mutations["${type}"] is undefined`))
		}
	}
	/**
	 * 执行 action
	 * @param {*} type action名
	 * @param {*} payload 传输数据
	 */
	dispatch(type, payload) {
		if (typeof type === 'string' && (typeof this.__actions[type] === 'function')) {
			this.__actions[type]({
				data: this._dataMirror(),
				payload,
				commit: this.commit.bind(this)
			})
		} else {
			console.error(new Error(`actions["${type}"] is undefined`))
		}
	}
	/**
	 * 获取指定mutation对象
	 * @param {*} p Object || Array
	 */
	mapMutations(p) {
		return this._map(p, (k) => {
			return (e) => {
				this.commit(p[k], e)
			}
		})
	}
	/**
	 * 获取指定Action对象
	 * @param {*} p Object || Array
	 */
	mapActions(p) {
		return this._map(p, (k) => {
			return (e) => {
				this.dispatch(p[k], e)
			}
		})
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
		this._store = new WxStore(p.store);
		this._store.bindStores([...p.bindStores], this);
		this._store._init(p, this);
		Object.assign(this, this._store.mapActions(p.mapActions), this._store.mapMutations(p.mapMutations));
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
	const ready = p.ready,
		detached = p.detached;
	p.ready = function () {
		const currentPage = getCurrentPage(this);
		if (currentPage._store) {
			this._store = currentPage._store;
			this._store.bindStores([...p.bindStores], this);
			this._store._init(p, this);
			Object.assign(this, this._store.mapActions(p.mapActions), this._store.mapMutations(p.mapMutations));
			ready && ready.apply(this, arguments)
		} else {
			ready && ready.apply(this, arguments)
		}
	}
	p.detached = function () {
		this._store && this._store._detach(this);
		detached && detached.apply(this, arguments);
	}
	Component(p)
}