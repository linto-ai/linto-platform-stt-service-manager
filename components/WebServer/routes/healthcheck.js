module.exports = (webserver) => {
    return [{
        path: '/',
        method: 'get',
        requireAuth: false,
        controller:
            (req, res, next) => {
                res.status(200).end()
            }
    }]
}