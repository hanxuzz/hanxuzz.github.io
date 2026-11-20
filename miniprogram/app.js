App({
  globalData: {
    // 绑定云开发后，把环境 ID 填在这里。留空时直接读本地赛程。
    envId: '',
    cloudReady: false,
    matches: []
  },

  onLaunch() {
    const envId = String(this.globalData.envId || '').trim()
    if (!envId || !wx.cloud) return
    wx.cloud.init({
      env: envId,
      traceUser: true
    })
    this.globalData.cloudReady = true
  }
})
