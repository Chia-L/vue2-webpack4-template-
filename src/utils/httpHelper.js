import axios from 'axios'
import message from 'element-ui/lib/message'

const CancelToken = axios.CancelToken

/**
 * http请求返回值校验器 对应 httpApi
 * @param res
 * @param resolve
 * @param reject
 */
export function checkResAndResolve(res, resolve, reject) {
  try {
    checkRes(res)
    resolve(res)
  } catch (e) {
    reject(e)
  }
}

/**
 * http请求返回值校验器 对应 httpHelper
 * @param res
 * @returns {*}
 */
export function checkRes(res) {
  if (res === null) {
    throw new Error('serve response null')
  }
  if (Number(res.r) === 0) {
    if (res.e) {
      return message({type: 'success', message: res.e})
    }
  }
  else {
    return message({type: 'error', message: res.e})
  }
}

/**
 * 请求重试
 */
class RetryCnt {
  constructor() {
    this._cnt = {}
  }
  // 检查 key
  _checkKey(key) {
    if (this._cnt[key] === undefined) {
      this._cnt[key] = 0
    }
  }
  // 获取key
  getCnt(key) {
    this._checkKey(key)
    return this._cnt[key]
  }
  // 添加 key
  addCnt(key) {
    this._checkKey(key)
    this._cnt[key]++
  }
  // 删除 key
  clearCnt(key) {
    if (this._cnt[key] === undefined) {
      return
    }
    this._cnt[key] = undefined
  }
}

/**
 * 设置axios参数options的baseURL值
 * @param mockType
 * @returns {string}
 */
function fetchBaseURL(mockType) {
  let baseURL = process.env.VUE_APP_BASE_API_LOCAL
  if (process.env.NODE_ENV === 'development') {
    if (mockType === 'local' || !mockType) {
      baseURL = process.env.VUE_APP_BASE_API_LOCAL
    } else if (mockType === 'proxy') {
      baseURL = process.env.VUE_APP_BASE_API_PROXY
    }
  }

  return baseURL
}

/**
 *
 * @param url
 * @param method
 * @param data
 * @param cb
 * @param params
 * @param mockType 开发模式有意义
 *           local: 请求本地服务（默认）
 *           proxy: 请求由代理转发
 */
export function httpHelper(url, method, data, cb, params, mockType) {
  let key = method + url
  let retryCnt = new RetryCnt

  // 处理超时重试：间隔 2 秒，重试 5 次
  function retryFetch() {
    if (retryCnt.getCnt(key) < 5) {
      setTimeout(function () {
        retryCnt.addCnt(key)
        httpHelper(url, method, data, cb, params)
      }, 2000)
      return true // 表示将进入重试！
    }
    return false // 表示不能重试了！
  }

  // 是否需要重试
  function needRetry(code) {
    return [502, 504].indexOf(code) !== -1
  }

  // 异常处理
  function showError(code, error) {
    if (code !== -1) {
      message({
        type: 'error',
        message: '内部错误，错误码：' + code
      })
    }
    console.log(error)
  }

  function checkNeedLogin(res_body, res_code) {
    if (res_code === 403) {
      window.location.href = '/#/login'
      return true
    }
    return false
  }

  // 处理响应 !200 错误，以及代码错误
  function handleException(e) {
    if (typeof e === 'string' && e.indexOf('~checkRes: ') !== -1) {
      return console.error(e)
    }

    // 1.有响应回来
    if (e.response) {
      var res_code = e.response.status
      var res_body = e.response.data || {}

      // 检查登陆过期
      if (checkNeedLogin(res_body, res_code)) {
        return
      }

      // 是否进入重试
      if (needRetry(res_code) && retryFetch()) {
        return
      }

      showError(res_code, res_body)
    }
    // 2.没响应回来（等待响应回来期间按了F5、响应丢失啦）
    else if (e.request) {
      showError(-1, '获取数据失败：响应丢失！')
      console.warn(e)
    }
    // 3.其他的错误
    else {
      showError(-1, '获取数据失败：代码异常！')
      console.error(e)
    }
  }

  const options = {
    url: url,
    method: method,
    baseURL: fetchBaseURL(mockType),
    // url参数使用 'GET', 'DELETE'
    params: method === ['GET', 'DELETE'].includes(method.toString().toUpperCase()) ? data : null,
    // 请求主体只适用于这些请求方法 'PUT', 'POST', 和 'PATCH'
    data: ['PUT', 'POST', 'PATCH'].includes(method.toString().toUpperCase()) ? data : null,
    // 务器响应的数据类型
    responseType: 'json',
    // 用作 xsrf token 的值的cookie的名称
    xsrfCookieName: 'csrftoken', // default
    // `xsrfHeaderName` is the name of the http header that carries the xsrf token value
    xsrfHeaderName: 'X-CSRFToken', // default
    cancelToken: new CancelToken(function (cancel) {
    })
  }
  axios(options).then(res => {
    retryCnt.clearCnt(key)
    cb(res.data, options, res)
  }).catch(e => {
    handleException(e)
    cb(null)
  })
}

const MsgType = {
  Error: 'error',
  Warning: 'warning',
  Info: 'info',
  Success: 'success',
  None: 'none'
}

function showTopMsg(msgType, content) {
  var inst

  // 默认都不自动消失
  if (msgType === MsgType.Error) {
    inst = message({message: content, type: 'error', duration: 0, showClose: true})
  }
  else if (msgType === MsgType.Warning) {
    inst = message({message: content, type: 'warning', duration: 0, showClose: true})
  }
  else if (msgType === MsgType.Info) {
    inst = message({message: content, type: 'info', duration: 0})
  }
  else if (msgType === MsgType.Success) {
    inst = message({message: content, type: 'success', duration: 0})
  }

  // 实现自动消失
  if (msgType === MsgType.Success || msgType === MsgType.Info) {
    inst['self-close-timer'] = setTimeout(function () {
      inst.close()
    }, 3000)
  }

  if (msgType === MsgType.Error || msgType === MsgType.Warning) {
    inst['self-close-timer'] = setTimeout(function () {
      inst.close()
    }, 5000)
  }

  return inst
}

/**
 * 批量处理 弹窗提示类型
 * @param r
 * @returns {string}
 */
function getResBodyMsgType(r) {
  switch (r) {
    case 0:
      return MsgType.Success
    case 1:
      return MsgType.Error
    case 2:
      return MsgType.Warning
    case 3:
      return MsgType.Info
  }

  return MsgType.None
}

/**
 * 批量处理时或需要返回Promise，请用httpApi
 * @param opts {url, method, data, cb, params}
 * @returns {Promise<unknown>}
 */
export function httpApi(opts) {
  function getMsgRender(response, msgInst) {
    let body = response.data
    let opSync = response.sync
    if (opts['resMsgRender'] && opts['resMsgRender']['renders']) {
      let renders = opts['resMsgRender']['renders']

      for (var i = 0; i < renders.length; i++) {
        let render = renders[i]
        let ctx = {resBody: body, opSync: opSync, msgInst: msgInst}
        Object.assign(ctx, opts['resMsgRender']['ctx'] || {})

        if (render(ctx)) {
          return render(ctx)
        }
      }
    }

    return {
      view: function () {
        return body.e
      },
      type: function () {
        return getResBodyMsgType(body.r)
      }
    }
  }
  // 检查响应中是否有消息
  function checkResponseMsg(response) {
    /* 所有的e的值均有后端管理
    fixedMessage(body, response.config.method || 'GET') */
    let resolveMsgInst
    let mRender = getMsgRender(response, new Promise(function (resolve) {
      resolveMsgInst = resolve
    }))
    let mContent = mRender.view()
    let mType = mRender.type()

    if ([MsgType.Error, MsgType.Warning, MsgType.Info, MsgType.Success].indexOf(mType) > -1 && mContent) {
      var msgInst = showTopMsg(mType, mContent)
      if (msgInst) {
        resolveMsgInst(msgInst)
      }
    }
    if (mType === MsgType.Error) {
      throw new Error('http api error, stop business go on!')
    }
  }

  return new Promise(function (resolve, reject) {
    httpHelper(opts.url, opts.method, opts.data, opts.params, function (res, params, response) {
      try {
        checkResponseMsg(response)
        resolve(response.data.data)
      } catch (e) {
        reject(e)
      }
    })
  })
}

export default {
  checkResAndResolve,
  checkRes,
  httpHelper,
  httpApi
}
