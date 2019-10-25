const debug = require('debug')('app:router:servicemanager')
let YAML = require('yamljs');
const multer = require('multer')
const form = multer({ dest: process.env.TEMP_FILE_PATH }).none()

function answer(out, res) {
    if (out.bool) res.json(out.msg)
    else { res.status(400); res.json({ status: out.msg }) }
}

module.exports = (webserver) => {
    return [{
        path: '/',
        method: 'get',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("getServices", (ans) => { answer(ans, res) })
            }
    },
    {
        path: '/running',
        method: 'get',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("getRunningServices", (ans) => { answer(ans, res) })
            }
    }]
}