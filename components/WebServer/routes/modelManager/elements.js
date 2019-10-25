const debug = require('debug')('app:router:elements')

function answer(out, res) {
    if (out.bool) res.json(out.msg)
    else { res.status(400); res.json({ status: out.msg }) }
}

module.exports = (webserver,type) => {
    return [{
        path: '/',
        method: 'get',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit(`getTypes`, (ans) => { answer(ans, res) }, req.params.modelId, type)
            }
    }]
}