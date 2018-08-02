/**
 *  获取素材列表
 * @param request
 * @returns {{type: string, offset: number, count: number}}
 */
function constructGetMaterialListParams(request) {
    return {
        type: request.type || 'news',
        offset: request.offset || 0,
        count: request.count || 1
    };
}

/**
 * 获取永久素材
 * @param request
 * @returns {{media_id: *}}
 */
function constructGetMaterialParams(request) {
    return {
        media_id: request.media_id
    };
}

module.exports = {
    constructGetMaterialListParams: constructGetMaterialListParams,
    constructGetMaterialParams: constructGetMaterialParams
};
