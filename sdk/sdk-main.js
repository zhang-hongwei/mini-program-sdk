const ver = '0.1.5'
const hostTest = ""
const host = ""
var conf = require('./sdk-mina-conf.js')
 
function start() {
    console.log("sdktatistic is started ")  
    Observer.refreshNetworkType(),
    VdsInstrumentAgent.initInstrument(Observer)
}
function f(t) {
  this.app = t
}
f.prototype.sendEvent = function (t, e) {
  var that = Observer
  that.saveEvent(that.makeClickEvent(e,t))
}
for (var LZString = function () { 
  return ""
}(),
  Utils = {
    bind: function(e, t) {
        return function() {
            t.apply(e, arguments)
        }
    },
    guid: function() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,
        function(e) {
            var t = 16 * Math.random() | 0,
            n = "x" == e ? t: 3 & t | 8;
            return n.toString(16)
        })+"-"+ Date.now()
    },
    getHost: function(){
      return sdk.debug ? hostTest : host;
    }
},
Observer = {
    currentPage: {},
    eventQueue: [],
    currentTimer: null,
    sessionId: null,
    SESSION_INTERVAL: 3e4,
    scene : null,
    resendPageTimer: null,
    uid: null,
    csParams: {},
    leaveAppTime: 0,
    refreshNetworkType: function() {
        wx.getNetworkType({
            success: Utils.bind(this,
            function(e) {
                this.networkType = e.networkType.toUpperCase()
            })
        })
    },
    setCS: function(e, t, n) {
      t && n && (this.csParams[t] = n)
    },
    resendPage: function() {
        this.lastPageEvent && (this.patchCS(this.lastPageEvent), this.saveEvent(this.lastPageEvent))
    },
    patchCS: function(e) {
      if (this.csParams.__defineGetter__.length > 0){
        e["cs"] = this.csParams
      }
    },
    appListener: function(e, t, n) {
        if (console.log("App.", t, Date.now()), "onLaunch" == t) {
          this.scene = n[0]
          var i = wx.getStorageSync("_sdk_data_");
            i && i.pv && i.other && (Uploader.messageQueue = i, wx.removeStorage({
              key: "_sdk_data_"
            }))
        } else if ("onHide" == t ){
          this.leaveAppTime = Date.now(),
          wx.setStorage({
            key: "_sdk_data_",
            data: Uploader.messageQueue
         }); 
        } else {
          "onShow" == t && Date.now() - this.leaveAppTime > this.SESSION_INTERVAL && (this.sessionId = null)
        } 
    },
    pageListener: function(e, t, n) {
      if (console.log("Page.", e.__route__, "#", t, Date.now(), n[0]), "onShow" == t) {
          if (!this.sessionId){
            this.sendVisitEvent(),
            this.upLoadUserInfoEvent();
          }
            this.refreshNetworkType(),
            this.currentPage.path = e.__route__,
            this.currentPage.time = Date.now();
            var i = {
                t: "page",
                tm: this.currentPage.time,
                p: e.__route__,
                q: this.sdkchannel,
                tl: e.data.sdkTitle,
                r: this.networkType,
            };
            this.lastPageEvent = i,
            this.saveEvent(i)
        } else if ("onLoad" == t) {
        var s = n[0]; this.sdkchannel = void 0;
        s && (this.sdkchannel = JSON.stringify(s))
        }
    },
    clickListener: function(e, t) {
        console.log("Click on ", e.currentTarget.id, Date.now()),
        this.saveEvent(this.makeClickEvent(e, t))
    },
    shareListener: function(e, t, n) {
      sdk.debug && console.log("share program")
      var i = {
          t:"share",
          f:e.from,
          p: this.currentPage.path,
          n 
      };
      this.saveEvent(i)
    },
    saveEvent: function(e) {
        var app = getApp(); 
        // if (Uploader.uploadingQueue.pv.length == 0 || ("click" == e.t && Uploader.uploadingQueue.other.length == 0)){
        if (this.eventQueue.length== 0){
          this.patchCS(e),
          e.ver = ver,
          e.pid = conf.projectId,
          e.aid = conf.appId,
          e.oid = app.sdkst_openid,
          e.unionid = app.sdkst_unionid,
          e.isnew = this.isnew,
          e.u = this.uid,
          e.s = this.sessionId
        }   
        e.tm = e.tm || Date.now(),  
        this.eventQueue.push(e),
        sdk.debug && console.info("genrate new event", JSON.stringify(e, 0, 2)),
        this.currentTimer || (this.currentTimer = setTimeout(Utils.bind(this,
        function() { 
            this.currentTimer = void 0;
            var e = [],
            t = [];
            this.eventQueue.map(function(n) {
                "click" == n.t ? t.push(n) : e.push(n)
            }),
            this.eventQueue = [],
            e.length && Uploader.uploadEvent("pv", e),
            t.length && Uploader.uploadEvent("other", t)
        }), 2e3))
    },
    sendVisitEvent: function() {
       this.uid || (this.uid = wx.getStorageSync("_sdktatistic_uid_"), this.uid || (this.isnew = 1), this.uid || (this.uid = Utils.guid(), wx.setStorageSync("_sdktatistic_uid_", this.uid))),
        this.sessionId || (this.sessionId = Utils.guid());
        var e = wx.getSystemInfoSync(),
        t = {
            t: "devinfo",
            l: e.language,
            sh: Math.round(e.windowHeight * e.pixelRatio),
            sw: Math.round(e.windowWidth * e.pixelRatio),
            wv: e.version,
            osv: e.system,
            dm: e.model.replace(/<.*>/, ""),
            r: this.networkType,
            scn : this.scene
        };
        this.saveEvent(t)
    },
    makeClickEvent: function(e, t) {
        var n = Date.now(),
        i = {
            t: "click",
            tm: n,
            p: this.currentPage.path,
            ptm: this.currentPage.time,
            x: e? e.currentTarget.id + ":" + t:void 0,
            v: e? e.currentTarget.dataset.sdkTitle:t,
            idx: e? e.currentTarget.dataset.sdkIdx:void 0,
            ct: e?0:1
        };
        return e?"cancel" !== e.type && "confirm" !== e.type || void 0 === i.e[0].v && (i.e[0].v = e.type):void 0,
        i
    },
    upLoadUserInfoEvent: function () {
      var that = this
      wx.getSetting({
        success: (res) => {
          if (conf.getUserinfo && res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: function (ress) {
                var user = ress.userInfo;
                delete user.nickName;
                var i = {
                    t:"user",
                    user
                };
                that.saveEvent(i)
              }
            })
          }
          if (conf.getLocation && res.authSetting['scope.userLocation']) {
            wx.getLocation({
              type:"wgs84",
              success: function(res) { 
                var i = {
                  t: "location",
                  res
                };
                that.saveEvent(i)
              }
            })
          }  
        }
      })
    },
},
VdsInstrumentAgent = {
    defaultPageCallbacks: {},
    defaultAppCallbacks: {},
    appHandlers: ["onLaunch", "onShow", "onHide"],
    pageHandlers: ["onLoad", "onReady", "onShow", "onHide", "onUnload", "onPullDownRefresh", "onReachBottom"],
    clickEventTypes: ["tap", "submit", "cancel", "confirm"],
    shareEventTypes: ["onShareAppMessage"],
    originalPage: Page,
    originalApp: App,
    instrument: function(e) {
        if (!sdk.isEnabled()) return e;
        for (var t in e)"function" == typeof e[t] && (e[t] = function(e, t) {
            return function() {
                var n = t.apply(this, arguments);
                try {
                    var i = arguments ? arguments[0] : void 0;
                    i && i.currentTarget && VdsInstrumentAgent.clickEventTypes.indexOf(i.type) != -1 && VdsInstrumentAgent.observer.clickListener(i, e),
                      VdsInstrumentAgent.shareEventTypes.indexOf(e) != -1 && VdsInstrumentAgent.observer.shareListener(i, e, n),
                    this._sdk_app_ && VdsInstrumentAgent.appHandlers.indexOf(e) != -1 && VdsInstrumentAgent.defaultAppCallbacks[e].apply(this, arguments),
                    this._sdk_page_ && VdsInstrumentAgent.pageHandlers.indexOf(e) != -1 && VdsInstrumentAgent.defaultPageCallbacks[e].apply(this, arguments)
                } catch(e) {
                    sdk.debug && console.log(e)
                }
                return n
            }
        } (t, e[t]));
        return e._sdk_app_ && VdsInstrumentAgent.appHandlers.map(function(t) {
            e[t] || (e[t] = VdsInstrumentAgent.defaultAppCallbacks[t])
        }),
        e._sdk_page_ && VdsInstrumentAgent.pageHandlers.map(function(t) {
            e[t] || (e[t] = VdsInstrumentAgent.defaultPageCallbacks[t])
        }),
        e
    },
    SdkPage: function(e) {
        e._sdk_page_ = !0,
        VdsInstrumentAgent.originalPage(VdsInstrumentAgent.instrument(e))
    },
    SdkApp: function(e) {
        e._sdk_app_ = !0,
        e.sdkst_openid = void 0,
        e.sdkst_unionid = void 0,
        e.sdkst = new f(this);
        VdsInstrumentAgent.originalApp(VdsInstrumentAgent.instrument(e))
    },
    initInstrument: function(e) {
        VdsInstrumentAgent.observer = e,         
        VdsInstrumentAgent.pageHandlers.forEach(function(e) {
            VdsInstrumentAgent.defaultPageCallbacks[e] = function() {
                this.__route__ && VdsInstrumentAgent.observer.pageListener(this, e, arguments)
            }
        }),
        VdsInstrumentAgent.appHandlers.forEach(function (e) {
            VdsInstrumentAgent.defaultAppCallbacks[e] = function () {
              VdsInstrumentAgent.observer.appListener(this, e, arguments)
            }
        }),
        Page = function() {
            return VdsInstrumentAgent.SdkPage(arguments[0])
        },
        App = function() {
            return VdsInstrumentAgent.SdkApp(arguments[0])
        }
    }
},
Uploader = {
    messageQueue: {
        pv: [],
        other: []
    },
    uploadingQueue: {
        pv: [],
        other: []
    },
    uploadingType: "",
    requestId: 0,
    isUploading: function() {
        return this.uploadingQueue.pv.length + this.uploadingQueue.other.length > 0
    },
    flushMessages: function(e) {
        this.uploadingQueue[e] = this.messageQueue[e].slice(),
        this.messageQueue[e] = [];
        var t = this.uploadingQueue[e];
        this.uploadingType = e;
        var n = Date.now(),
        i = JSON.stringify(t),
        v = i;
        var url = Utils.getHost() + "?" + "data=3^" + v;
        sdk.debug && console.log("uploading = ", url),
        this.requestId++,
        wx.request({
          url: url,
            header: {
                "X-Compress-Codec": "1",
                "X-Crypt-Codec": "1",
                "X-Encode-Codec": "1"
            },
            method: "POST",
            data: {}, 
            success: Utils.bind(this,
            function() {
                sdk.debug && console.log("upload succeed", this.requestId),
                this.uploadingQueue[this.uploadingType] = [],
                this.messageQueue.pv.length > 0 ? this.flushMessages("pv") : this.messageQueue.other.length > 0 && this.flushMessages("other")
            }),
            fail: Utils.bind(this,
            function() {
                this.messageQueue[this.uploadingType] = this.uploadingQueue[this.uploadingType].concat(this.messageQueue[this.uploadingType]),
                this.uploadingQueue[this.uploadingType] = []
            })
            
        })

    },
    uploadEvent: function (e, t) {
    conf.projectId && (this.messageQueue[e] = this.messageQueue[e].concat(t), this.isUploading() || this.flushMessages(e))
    }
},

sdk = { 
    debug: !1,
    start: function (t) {
      sdk.debug = t;
      start()
    }, 
    isEnabled: function() {
      return conf.projectId && conf.appId
    }
},

i = 0; i < 1; i++) sdk["setCS"] = function(e) {
    return function(t, n) {
        n = void 0 === n || null === n ? "": String(n),
        Observer.setCS(e, t, n)
    }
} (i);
module.exports = sdk;