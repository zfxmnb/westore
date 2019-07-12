import { WxStore } from './wxstore.js'
export default new WxStore({
  data: {
    year: 2019
  },
  mutations: {
    setYear({ data, setData, payload}) {
      setData({ year: payload})
    }
  },
  actions: {
    addYear({ data, commit}){
      commit('setYear', data.year + 1)
    }
  }
})