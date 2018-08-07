/**
 * 授权流程
 */
const __GET_COMPONENT_TOKEN__ = 'https://api.weixin.qq.com/cgi-bin/component/api_component_token';
const __CREATE_PRE_AUTH_CODE__ = 'https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token=%s';
const __QUERY_AUTHORIZATION__ = 'https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token=%s';
const __REFRESH_AUTHORIZER_TOKEN__ = 'https://api.weixin.qq.com/cgi-bin/component/api_authorizer_token?component_access_token=%s';
const __BIND_COMPONENT_AUTHORITY_PAGE__ = 'https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=%s&pre_auth_code=%s&redirect_uri=%s&auth_type=%s';
const __BIND_COMPONENT__ = 'https://mp.weixin.qq.com/safe/bindcomponent?action=bindcomponent&auth_type=%s&no_scan=1&component_appid=%s&pre_auth_code=%s&redirect_uri=%s&biz_appid=%s#wechat_redirect';
const __GET_AUTHORIZER_INFO__ = 'https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?component_access_token=%s';
const __GET_AUTHORIZER_OPTION__ = 'https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_option?component_access_token=%s';
const __SET_AUTHORIZER_OPTION__ = 'https://api.weixin.qq.com/cgi-bin/component/api_set_authorizer_option?component_access_token=%s';

/**
 * 代公众号调用接口
 */
const __CLEAR_QUOTA__ = 'https://api.weixin.qq.com/cgi-bin/component/clear_quota?component_access_token=%s';

/**
 * 代公众号发起网页授权
 */
const __CODE__ = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s&component_appid=%s#wechat_redirect';
const __ACCESS_TOKEN__ = 'https://api.weixin.qq.com/sns/oauth2/component/access_token?appid=%s&code=%s&grant_type=authorization_code&component_appid=%s&component_access_token=%s';
const __REFRESH_TOKEN__ = 'https://api.weixin.qq.com/sns/oauth2/component/refresh_token?appid=%s&grant_type=refresh_token&component_appid=%s&component_access_token=%s&refresh_token=%s';
const __USER_INFO__ = 'https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s&lang=zh_CN';

/**
 * 辅助
 */
const __GET_AUTHORIZER_LIST__ = 'https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_list?component_access_token=%s';

module.exports = {
    __GET_COMPONENT_TOKEN__: __GET_COMPONENT_TOKEN__,
    __CREATE_PRE_AUTH_CODE__: __CREATE_PRE_AUTH_CODE__,
    __QUERY_AUTHORIZATION__: __QUERY_AUTHORIZATION__,
    __REFRESH_AUTHORIZER_TOKEN__: __REFRESH_AUTHORIZER_TOKEN__,
    __BIND_COMPONENT_AUTHORITY_PAGE__: __BIND_COMPONENT_AUTHORITY_PAGE__,
    __BIND_COMPONENT__: __BIND_COMPONENT__,
    __GET_AUTHORIZER_INFO__: __GET_AUTHORIZER_INFO__,
    __GET_AUTHORIZER_OPTION__: __GET_AUTHORIZER_OPTION__,
    __SET_AUTHORIZER_OPTION__: __SET_AUTHORIZER_OPTION__,
    __CLEAR_QUOTA__: __CLEAR_QUOTA__,
    __CODE__: __CODE__,
    __ACCESS_TOKEN__: __ACCESS_TOKEN__,
    __REFRESH_TOKEN__: __REFRESH_TOKEN__,
    __USER_INFO__: __USER_INFO__,
    __GET_AUTHORIZER_LIST__: __GET_AUTHORIZER_LIST__
};