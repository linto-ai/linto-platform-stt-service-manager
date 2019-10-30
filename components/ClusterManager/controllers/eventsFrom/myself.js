const debug = require('debug')(`app:dockerswarm:eventsFrom:myself`)

// this is bound to the component
module.exports = function () {
    this.on('verifServices', async () => {
        const services = await this.db.service.findServices()
        if (services !== -1) {
            services.forEach(async service => {
                if (service.isOn) { //check if the service is running
                    const info = this.cluster.getServiceInfo(service.serviceId)
                    if (info.modem.checkServerIdentity === undefined) {
                        await this.cluster.createService(service)
                        const check = await this.cluster.checkServiceOn(service)
                        if (check) {
                            this.emit("serviceStarted", { service: service.serviceId, port: process.env.LINSTT_PORT })
                        }
                    }
                } else { //
                    const info = this.cluster.getServiceInfo(service.serviceId)
                    debug(info)
                    if (info.modem.checkServerIdentity !== undefined) {
                        await this.cluster.deleteService(service.serviceId)
                    }
                }
            })
        }
    })
}