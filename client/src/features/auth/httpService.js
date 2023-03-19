import axios from "axios";

function getLocalAccessToken() {
	const accessToken = localStorage.getItem("access");
	return accessToken;
  }
  
  function getLocalRefreshToken() {
	const refreshToken = localStorage.getItem("refresh");
	return refreshToken;
  }

  const baseURLz = "/api/v1/"
  
  export const authAxios = axios.create({
	baseURL: baseURLz,
	headers: {
        Authorization: getLocalAccessToken()
            ? 'Bearer ' + getLocalAccessToken() : null,
        'Content-Type': 'application/json',
        accept: 'application/json'
    }
  });
  
  authAxios.interceptors.request.use(
	(config) => {
	  const token = getLocalAccessToken();
	  if (token) {
		config.headers["x-access-token"] = token;
	  }
	  return config;
	},
	(error) => {
	  return Promise.reject(error);
	}
  );
  
  authAxios.interceptors.response.use(
	(res) => {
	  return res;
	},
	async (err) => {
	  const originalConfig = err.config;
  
	  if (err.response) {
		// Access Token was expired
		if (err.response.status === 401 && !originalConfig._retry) {
		  originalConfig._retry = true;
  
		  try {
			const rs = await refreshToken();
			const { access } = rs.data;
			localStorage.setItem("access", access);
			authAxios.defaults.headers.common["x-access-token"] = access;
  
			return authAxios(originalConfig);
		  } catch (_error) {
			if (_error.response && _error.response.data) {
				window.location.href = '/login/'
			  return Promise.reject(_error.response.data);
			}
  
			return Promise.reject(_error);
		  }
		}
  
		if (err.response.status === 403 && err.response.data) {
		  return Promise.reject(err.response.data);
		}
	  }
  
	  return Promise.reject(err);
	}
  );
  
  function refreshToken() {
	return axios.post("/api/v1/auth/jwt/refresh/", {
	  refresh: JSON.parse(getLocalRefreshToken()),
	});
  }
  

  