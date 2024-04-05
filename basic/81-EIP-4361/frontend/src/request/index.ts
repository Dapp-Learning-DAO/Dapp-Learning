import axios from "axios";
import { toast } from "react-hot-toast";

interface IResponse<T> {
  status: number;
  message: string;
  result: T;
}

axios.defaults.timeout = 100000;
axios.defaults.baseURL = "http://localhost:8000";

// axios.defaults.baseURL = "http://116.62.121.151";
// 请求拦截器  1，可以在这里添加token

axios.interceptors.request.use(
  function (config) {
    config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    // config.headers["webwea-agent"] = isMobile() ? "h5" : "pc";
    return config;
  },
  function (error) {
    // 对请求错误做些什么

    return Promise.reject(error);
  }
);

// 添加响应拦截器

axios.interceptors.response.use(
  function (response) {
    // toast.success(response.data.message);
    return response;
  },
  function (error) {
    //   // 超出 2xx 范围的状态码都会触发该函数。
    //   // 对响应错误做点什么

    return Promise.reject(error.response.data);
  }
);

export function get<T>(url: string, params = {}) {
  return new Promise<IResponse<T>>((resolve, reject) => {
    axios
      .get(url, {
        params: params,
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function post<T>(url: string, data = {}, config = {}) {
  return new Promise<IResponse<T>>((resolve, reject) => {
    axios.post(url, data, config).then(
      (response) => {
        //关闭进度条
        resolve(response.data);
      },
      (err) => {
        reject(err);
      }
    );
  });
}

export function patch(url: string, data = {}) {
  return new Promise((resolve, reject) => {
    axios.patch(url, data).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        msag(err);
        reject(err);
      }
    );
  });
}

export function put<T>(url: string, data = {}) {
  return new Promise((resolve, reject) => {
    axios.put<IResponse<T>>(url, data).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        msag(err);
        reject(err);
      }
    );
  });
}

//失败提示
function msag(err) {
  if (err && err.response) {
    switch (err.response.status) {
      case 400:
        alert(err.response.data.error.details);
        break;
      case 401:
        alert("未授权，请登录");
        break;

      case 403:
        alert("拒绝访问");
        break;

      case 404:
        alert("请求地址出错");
        break;

      case 408:
        alert("请求超时");
        break;

      case 500:
        alert("服务器内部错误");
        break;

      case 501:
        alert("服务未实现");
        break;

      case 502:
        alert("网关错误");
        break;

      case 503:
        alert("服务不可用");
        break;

      case 504:
        alert("网关超时");
        break;

      case 505:
        alert("HTTP版本不受支持");
        break;
      default:
    }
  }
}
