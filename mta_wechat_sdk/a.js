"use strict";

var ver = "0.1.6";
var hostTest = "";
var host = "";
var conf = require("./con.js");

function _start() {
 
    Observer.refreshNetworkType();
    VdsInstrumentAgent.initInstrument(Observer);
    // console.log("===>Observer", Observer);
}

function f(t) {
    this.app = t;
}

f.prototype.sendEvent = function(t, e) {
    var that = Observer;
    that.saveEvent(that.makeClickEvent(e, t));
};

var LZString = (function() {
    return "";
})();

var Utils = {
    bind: function bind(e, t) {
        return function() {
            t.apply(e, arguments);
        };
    },
    guid: function guid() {
        return (
            "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(
                e
            ) {
                var t = (16 * Math.random()) | 0,
                    n = "x" == e ? t : (3 & t) | 8;
                return n.toString(16);
            }) +
            "-" +
            Date.now()
        );
    },
    getHost: function getHost() {
        return sdkTest.debug ? hostTest : host;
    }
};

var Observer = {
    currentPage: {},
    eventQueue: [],
    currentTimer: null,
    sessionId: null,
    SESSION_INTERVAL: 3e4,
    scene: null,
    resendPageTimer: null,
    uid: null,
    csParams: {},
    leaveAppTime: 0,
    refreshNetworkType: function refreshNetworkType() {
        // console.log("===>refreshNetworkType");
        wx.getNetworkType({
            success: Utils.bind(this, function(e) {
                this.networkType = e.networkType.toUpperCase();
            })
        });
    },
    setCS: function setCS(e, t, n) {
        t && n && (this.csParams[t] = n);
    },
    resendPage: function resendPage() {
        this.lastPageEvent &&
            (this.patchCS(this.lastPageEvent),
            this.saveEvent(this.lastPageEvent));
    },
    patchCS: function patchCS(e) {
        if (this.csParams.__defineGetter__.length > 0) {
            e["cs"] = this.csParams;
        }
    },
    appListener: function appListener(e, t, n) {
        // console.log("===>>>>e", e);
        if ((console.log("App.", t, Date.now()), "onLaunch" == t)) {
            this.scene = n[0];
            var i = wx.getStorageSync("_sdk_data_");
            i &&
                i.pv &&
                i.other &&
                ((Uploader.messageQueue = i),
                wx.removeStorage({
                    key: "_sdk_data_"
                }));
        } else if ("onHide" == t) {
            if ((this.leaveAppTime = Date.now())) {
                wx.setStorage({
                    key: "_sdk_data_",
                    data: Uploader.messageQueue
                });
            }
        } else {
            "onShow" == t &&
                Date.now() - this.leaveAppTime > this.SESSION_INTERVAL &&
                (this.sessionId = null);
        }
    },
    pageListener: function pageListener(e, t, n) {
        console.log("===>eee===>", e);
        if (
            (console.log("Page.", e.__route__, "#", t, Date.now(), n[0]),
            "onShow" == t)
        ) {
            if (!this.sessionId) {
                this.sendVisitEvent(), this.upLoadUserInfoEvent();
            }
            (this.currentPage.path = e.__route__),
                (this.currentPage.time = Date.now());
            var i = {
                t: "page",
                tm: this.currentPage.time,
                p: e.__route__,
                q: this.sdkchannel,
                tl: e.data.sdkTitle
            };
            (this.lastPageEvent = i), this.saveEvent(i);
        } else if ("onLoad" == t) {
            var s = n[0];
            this.sdkchannel = undefined;
            s && (this.sdkchannel = JSON.stringify(s));
        }
    },
    clickListener: function clickListener(e, t) {
        console.log("Click on ", e.currentTarget.id, Date.now());
        if (e.currentTarget.dataset.sdkTitle || e.currentTarget.dataset.sdkIdx) {
            this.saveEvent(this.makeClickEvent(e, t));
        }
    },
    shareListener: function shareListener(e, t, n) {
        sdkTest.debug && console.log("share program");
        var i = {
            t: "share",
            f: e.from,
            p: this.currentPage.path,
            n: n
        };
        this.saveEvent(i);
    },
    saveEvent: function saveEvent(e) {
        var app = getApp();
        if (this.eventQueue.length == 0) {
            this.patchCS(e),
                (e.ver = ver),
                (e.pid = conf.projectId),
                (e.aid = conf.appId),
                (e.oid = app.sdkst_openid),
                (e.unionid = app.sdkst_unionid),
                (e.isnew = this.isnew),
                (e.u = this.uid),
                (e.s = this.sessionId);
        }
        (e.tm = e.tm || Date.now()),
            this.eventQueue.push(e),
            sdkTest.debug &&
                console.info("genrate new event", JSON.stringify(e, 0, 2)),
            this.currentTimer ||
                (this.currentTimer = setTimeout(
                    Utils.bind(this, function() {
                        this.currentTimer = undefined;
                        var e = [],
                            t = [];
                        this.eventQueue.map(function(n) {
                            e.push(n);
                        }),
                            (this.eventQueue = []),
                            e.length && Uploader.uploadEvent("pv", e),
                            t.length && Uploader.uploadEvent("other", t);
                    }),
                    2e3
                ));
    },
    sendVisitEvent: function sendVisitEvent() {
        this.uid ||
            ((this.uid = wx.getStorageSync("_sdkTest_uid_")),
            this.uid || (this.isnew = 1),
            this.uid ||
                ((this.uid = Utils.guid()),
                wx.setStorageSync("_sdkTest_uid_", this.uid))),
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
                scn: this.scene
            };
        this.saveEvent(t);
    },
    makeClickEvent: function makeClickEvent(e, t) {
        var n = Date.now(),
            i = {
                t: "click",
                tm: n,
                p: this.currentPage.path,
                ptm: this.currentPage.time,
                x: e ? e.currentTarget.id + ":" + t : undefined,
                v: e ? e.currentTarget.dataset.sdkTitle : t,
                idx: e ? e.currentTarget.dataset.sdkIdx : undefined,
                ct: e ? 0 : 1
            };
        return (
            e
                ? ("cancel" !== e.type && "confirm" !== e.type) ||
                  (undefined === i.e[0].v && (i.e[0].v = e.type))
                : undefined,
            i
        );
    },
    upLoadUserInfoEvent: function upLoadUserInfoEvent() {
        var that = this;
        if (wx.canIUse("getSetting")) {
            wx.getSetting({
                success: function success(res) {
                    if (conf.getUserinfo && res.authSetting["scope.userInfo"]) {
                        wx.getUserInfo({
                            success: function success(ress) {
                                var user = ress.userInfo;
                                delete user.nickName;
                                var i = {
                                    t: "user",
                                    user: user
                                };
                                that.saveEvent(i);
                            }
                        });
                    }
                    if (
                        conf.getLocation &&
                        res.authSetting["scope.userLocation"]
                    ) {
                        wx.getLocation({
                            type: "wgs84",
                            success: function success(res) {
                                var i = {
                                    t: "location",
                                    res: res
                                };
                                that.saveEvent(i);
                            }
                        });
                    }
                }
            });
        }
    }
};

var VdsInstrumentAgent = {
    defaultPageCallbacks: {},
    defaultAppCallbacks: {},
    appHandlers: ["onLaunch", "onShow", "onHide"],
    pageHandlers: [
        "onLoad",
        "onReady",
        "onShow",
        "onHide",
        "onUnload",
        "onPullDownRefresh",
        "onReachBottom"
    ],
    clickEventTypes: ["tap", "submit", "cancel", "confirm"],
    shareEventTypes: ["onShareAppMessage"],
    originalPage: Page,
    originalApp: App,
    instrument: function instrument(e) {
        if (!sdkTest.isEnabled()) return e;
        for (var t in e) {
            "function" == typeof e[t] &&
                (e[t] = (function(e, t) {
                    return function() {
                        var n = t.apply(this, arguments);
                        try {
                            var i = arguments ? arguments[0] : undefined;
                            i &&
                                i.currentTarget &&
                                VdsInstrumentAgent.clickEventTypes.indexOf(
                                    i.type
                                ) != -1 &&
                                VdsInstrumentAgent.observer.clickListener(i, e),
                                VdsInstrumentAgent.shareEventTypes.indexOf(e) !=
                                    -1 &&
                                    VdsInstrumentAgent.observer.shareListener(
                                        i,
                                        e,
                                        n
                                    ),
                                this._sdk_app_ &&
                                    VdsInstrumentAgent.appHandlers.indexOf(e) !=
                                        -1 &&
                                    VdsInstrumentAgent.defaultAppCallbacks[
                                        e
                                    ].apply(this, arguments),
                                this._sdk_page_ &&
                                    VdsInstrumentAgent.pageHandlers.indexOf(
                                        e
                                    ) != -1 &&
                                    VdsInstrumentAgent.defaultPageCallbacks[
                                        e
                                    ].apply(this, arguments);
                        } catch (e) {
                            sdkTest.debug && console.log(e);
                        }
                        return n;
                    };
                })(t, e[t]));
        }
        return (
            e._sdk_app_ &&
                VdsInstrumentAgent.appHandlers.map(function(t) {
                    e[t] || (e[t] = VdsInstrumentAgent.defaultAppCallbacks[t]);
                }),
            e._sdk_page_ &&
                VdsInstrumentAgent.pageHandlers.map(function(t) {
                    e[t] || (e[t] = VdsInstrumentAgent.defaultPageCallbacks[t]);
                }),
            e
        );
    },
    SdkPage: function SdkPage(e) {
        e._sdk_page_ = true;
        VdsInstrumentAgent.originalPage(VdsInstrumentAgent.instrument(e));
    },
    SdkApp: function SdkApp(e) {
        e._sdk_app_ = true;
        e.sdkst_openid = undefined;
        e.sdkst_unionid = undefined;
        e.sdkst = new f(this);
        VdsInstrumentAgent.originalApp(VdsInstrumentAgent.instrument(e));
    },
    initInstrument: function initInstrument(e) {
        // console.log("initInstrument===>", wx);
        console.log("VdsInstrumentAgent===>", VdsInstrumentAgent);

        VdsInstrumentAgent.observer = e;
        VdsInstrumentAgent.pageHandlers.forEach(function(e) {
            console.log("========>>>>e", e);
            VdsInstrumentAgent.defaultPageCallbacks[e] = function() {
                // console.log("===>this.", this);
                // this.__route__ &&
                //   VdsInstrumentAgent.observer.pageListener(this, e, arguments);
                //   this.__route__ &&
                VdsInstrumentAgent.observer.pageListener(this, e, arguments);
            };
        });
        VdsInstrumentAgent.appHandlers.forEach(function(e) {
            VdsInstrumentAgent.defaultAppCallbacks[e] = function() {
                // console.log("===>this.", this);
                VdsInstrumentAgent.observer.appListener(this, e, arguments);
            };
        });
        Page = function Page() {
            console.log("%c---+++++---", "color:red");
            console.log("监控page");
            console.log("%c---+++++---", "color:red");
            return VdsInstrumentAgent.SdkPage(arguments[0]);
        };
        App = function App() {
            return VdsInstrumentAgent.SdkApp(arguments[0]);
        };
        // (VdsInstrumentAgent.observer = e),
        //   VdsInstrumentAgent.pageHandlers.forEach(function(e) {
        //     VdsInstrumentAgent.defaultPageCallbacks[e] = function() {
        //       // console.log("this.__route__===>", this);
        //       this.__route__ &&
        //         VdsInstrumentAgent.observer.pageListener(this, e, arguments);
        //     };
        //   }),
        //   VdsInstrumentAgent.appHandlers.forEach(function(e) {
        //     VdsInstrumentAgent.defaultAppCallbacks[e] = function() {
        //       VdsInstrumentAgent.observer.appListener(this, e, arguments);
        //     };
        //   }),
        //   (Page = function Page() {
        //     return VdsInstrumentAgent.SdkPage(arguments[0]);
        //   }),
        //   (App = function App() {
        //     return VdsInstrumentAgent.SdkApp(arguments[0]);
        //   });
    }
};

var Uploader = {
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
    isUploading: function isUploading() {
        return (
            this.uploadingQueue.pv.length + this.uploadingQueue.other.length > 0
        );
    },
    flushMessages: function flushMessages(e) {
        (this.uploadingQueue[e] = this.messageQueue[e].slice()),
            (this.messageQueue[e] = []);
        var t = this.uploadingQueue[e];
        this.uploadingType = e;
        var n = Date.now(),
            i = JSON.stringify(t),
            v = i;
        var url = Utils.getHost() + "?" + "data=3^" + v;
        sdkTest.debug && console.log("uploading = ", url),
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
                success: Utils.bind(this, function() {
                    console.log("成功"),
                        sdkTest.debug &&
                            console.log("upload succeed", this.requestId),
                        (this.uploadingQueue[this.uploadingType] = []),
                        this.messageQueue.pv.length > 0
                            ? this.flushMessages("pv")
                            : this.messageQueue.other.length > 0 &&
                              this.flushMessages("other");
                }),
                fail: Utils.bind(this, function() {
                    console.log("失败"),
                        (this.messageQueue[
                            this.uploadingType
                        ] = this.uploadingQueue[this.uploadingType].concat(
                            this.messageQueue[this.uploadingType]
                        )),
                        (this.uploadingQueue[this.uploadingType] = []);
                })
            });
    },
    uploadEvent: function uploadEvent(e, t) {
        conf.projectId &&
            ((this.messageQueue[e] = this.messageQueue[e].concat(t)),
            this.isUploading() || this.flushMessages(e));
    }
};

var sdkTest = {
    debug: false,
    start: function start(t) {
        sdkTest.debug = t;
        _start();
    },
    isEnabled: function isEnabled() {
        return conf.projectId && conf.appId;
    },
    test: "测试账号"
};

for (var i = 0; i < 1; i++) {
    sdkTest["setCS"] = (function(e) {
        return function(t, n) {
            (n = undefined === n || null === n ? "" : String(n)),
                Observer.setCS(e, t, n);
        };
    })(i);
}
module.exports = sdkTest;
