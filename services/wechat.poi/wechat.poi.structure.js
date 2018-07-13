/**
 * 查询门店列表
 * @param request
 * @returns {{begin: number, limit: number}}
 */
function constructFetchPoiList(request) {
    return {
        begin: request.begin || 0,
        limit: request.limit || 10
    };
}

/**
 * 查询门店信息
 * @param request
 * @returns {{poi_id: *}}
 */
function constructFetchPoiDetail(request) {
    return {
        poi_id: request.poi_id
    };
}

module.exports = {
    constructFetchPoiList: constructFetchPoiList,
    constructFetchPoiDetail: constructFetchPoiDetail
};