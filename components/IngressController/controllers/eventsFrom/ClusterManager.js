const debug = require('debug')(`app:ingresscontroller:eventsFrom:ClusterManager`)

// this is bound to the component
module.exports = function () {
    if (!this.app.components['ClusterManager']) return

    this.app.components['ClusterManager'].on('serviceStarted', async (info) => {
        this.ingress.addUpStream(info)
        await this.ingress.reloadNginx()
    })
    this.app.components['ClusterManager'].on('serviceStopped', async (serviceId) => {
        this.ingress.removeUpStream(serviceId)
        await this.ingress.reloadNginx()
    })
    this.app.components['ClusterManager'].on('serviceScaled', async () => {
        await this.ingress.reloadNginx()
    })
    this.app.components['ClusterManager'].on('serviceReloaded', async () => {
    })
}
