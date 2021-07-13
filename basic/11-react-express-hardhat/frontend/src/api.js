/* eslint-disable */
// 小程序开发api接口工具包，https://github.com/gooking/wxapi
import authorizationConf from './authorization_conf.json'
var API_BASE_URL = "http://127.0.0.1:4001";
const axios = require("axios").default;

let request = (url, method, data) => {
  const _url = API_BASE_URL + url;
  const header = {
    "Content-Type": "application/json",
    Authorization: authorizationConf.Authorization,
  };
  return new Promise((resolve, reject) => {
    axios({
      url: _url,
      method: method,
      data: data,
      header,
    }).then((res) => {
      resolve(res);
    });
  });
};

module.exports = {
  receipt_create: (data) => {
    return request("/receipt/create", "post", data);
  },
  receipt_list: (adress) => {
    return request("/receipt/all?from=" + adress, "get", {});
  },
};
