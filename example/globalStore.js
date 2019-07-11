import { WxStore } from './wxstore.js'
export default new WxStore({
  data: {
    year: 2019
  },
  actions: {},
  mutations: {
    addYear({ data, setData, payload = {} }) {
      setData({ year: data.year + 1 })
    }
  }
})