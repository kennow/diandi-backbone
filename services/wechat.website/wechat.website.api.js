const __CODE__ = 'https://open.weixin.qq.com/connect/qrconnect?appid=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s#wechat_redirect';
const __ACCESS_TOKEN__ = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code';
const __REFRESH_TOKEN__ = 'https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=%s&grant_type=refresh_token&refresh_token=%s';
const __USER_INFO__ = 'https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s';

module.exports = {
    __CODE__: __CODE__,
    __ACCESS_TOKEN__: __ACCESS_TOKEN__,
    __REFRESH_TOKEN__: __REFRESH_TOKEN__,
    __USER_INFO__: __USER_INFO__
}
