/**
 * @typedef{import('./base')} Engine
 */

try {
    /**
     * @type{Engine[]}
    */
    const engines = [
        require('./javascript_family.js'),
        require('./php.js'),
        require('./go.js'),
        require('./python.js')

    ]
    /**
     * @type{Object<string, Engine>}
     */
    let languageMap = {};

    for (const engineCls of engines) {
        const engine = new engineCls()
        for (const languageId of engine.languageIds) {
            languageMap[languageId] = engine;
        }

    }


    module.exports = languageMap

} catch (error) {
    console.dir(error)    
}
