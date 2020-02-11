const debug = require('debug')(`app:dockerswarm:eventsFrom:WebServer`)

// this is bound to the component
module.exports = function () {
    if (!this.app.components['WebServer']) return

    this.app.components['WebServer'].on('createService', async (cb, payload) => {
        /**
          * Create a service by its "serviceId"
          * @param {Object} payload: {serviceId, replicas, tag}
          * @returns {Object}
        */
        try {
            if (payload.replicas === undefined) throw 'Undefined field \'replicas\' (required)'
            if (payload.replicas < 1) throw '\'replicas\' must be greater or equal to 1'
            if (payload.tag === undefined) throw 'Undefined field \'tag\' (required)'
            if (!this.verifTag(payload.tag)) throw `Unrecognized \'tag\'. Supported tags are: ${this.tag}`
            if (payload.languageModel === undefined) throw 'Undefined field \'languageModel\' (required)'
            const lmodel = await this.db.lm.findModel(payload.languageModel)
            if (lmodel === -1) throw `Language Model '${payload.languageModel}' does not exist`
            debug(lmodel)
            const request = {
                serviceId: payload.serviceId,
                tag: payload.tag,
                replicas: payload.replicas,
                LModelId: lmodel.modelId,
                AModelId: lmodel.acmodelId,
                lang: lmodel.lang
            }
            const res = await this.db.service.createService(request)
            if (res === -1)
                throw `Service '${payload.serviceId}' is already created`
            return cb({ bool: true, msg: `Service '${payload.serviceId}' is successfully created` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('updateService', async (cb, payload) => {
        /**
          * Update a service by its "serviceId"
          * @param {Object} payload: {serviceId, replicas, tag}
          * @returns {Object}
        */
        try {
            let update = {}
            if (payload.replicas != undefined) {
                if (payload.replicas < 1) throw '\'replicas\' must be greater or equal to 1'
                update.replicas = payload.replicas
            }
            if (payload.tag != undefined) {
                if (!this.verifTag(payload.tag)) throw 'Unrecognized \'tag\'. tag = [offline, online, gpu, cpu]'
                update.tag = payload.tag
            }
            if (payload.languageModel != undefined) {
                const lmodel = await this.db.lm.findModel(payload.languageModel)
                if (lmodel === -1) throw `Language Model '${payload.languageModel}' does not exist`
                update.LModelId = lmodel.modelId
                update.AModelId = lmodel.acmodelId
            }
            const res = await this.db.service.updateService(payload.serviceId, update)
            if (res === -1)
                throw `Service '${payload.serviceId}' does not exist`
            return cb({ bool: true, msg: `Service '${payload.serviceId}' is successfully updated` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('deleteService', async (cb, serviceId) => {
        /**
          * Remove a service by its "serviceId"
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (service === -1) throw `Service '${serviceId}' does not exist`
            if (service.isOn) throw `Service '${serviceId}' is running`
            const res = await this.db.service.deleteService(serviceId)
            if (res === -1)
                throw `Service '${serviceId}' does not exist`
            return cb({ bool: true, msg: `Service '${serviceId}' is successfully removed` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('getService', async (cb, serviceId) => {
        /**
          * Find a service by its "serviceId"
          * @param serviceId
          * @returns {Object}
        */
        try {
            const res = await this.db.service.findService(serviceId)
            if (res === -1)
                throw `Service '${serviceId}' does not exist`
            return cb({ bool: true, msg: res })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('getServices', async (cb) => {
        /**
          * Find all created services
          * @param None
          * @returns {Object}
        */
        try {
            const res = await this.db.service.findServices()
            if (res === -1)
                throw `No service has been created`
            return cb({ bool: true, msg: res })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })


    this.app.components['WebServer'].on('startService', async (cb, serviceId) => {
        /**
          * Create a docker service by service Object
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (service === -1) throw `Service '${serviceId}' does not exist`
            if (service.isOn) throw `Service '${serviceId}' is already started`
            if (! await this.db.lm.getModelState(service.LModelId)) throw `Service '${serviceId}' could not be started (Language Model '${service.LModelId}' has not been generated yet)`
            await this.cluster.createService(service)
            const check = await this.cluster.checkServiceOn(service)
            if (check) {
                this.emit("serviceStarted", { service: serviceId, port: process.env.LINSTT_PORT })
                await this.db.service.updateService(serviceId, { isOn: 1, isDirty: 0 })
            }
            else {
                await this.cluster.deleteService(serviceId)
                throw `Something went wrong. Service '${serviceId}' is not started`
            }
            return cb({ bool: true, msg: `Service '${serviceId}' is successfully started` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('stopService', async (cb, serviceId) => {
        /**
          * delete a docker service by service Object
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (service === -1) throw `Service '${serviceId}' does not exist`
            if (!service.isOn) throw `Service '${serviceId}' is not running`
            await this.cluster.deleteService(serviceId)
            await this.cluster.checkServiceOff(serviceId)
            await this.db.service.updateService(serviceId, { isOn: 0 })
            this.emit("serviceStopped", serviceId)
            return cb({ bool: true, msg: `Service '${serviceId}' is successfully stopped` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('scaleService', async (cb, payload) => {
        /**
          * Update a docker service by service Object
          * @param {Object}: {serviceId, replicas}
          * @returns {Object}
        */
        try {
            if (payload.replicas < 1) throw 'The scale must be greater or equal to 1'
            await this.cluster.scaleService(payload)
            await this.cluster.checkServiceOn(payload)
            await this.db.service.updateService(payload.serviceId, { replicas: payload.replicas })
            this.emit("serviceScaled")
            return cb({ bool: true, msg: `Service '${payload.serviceId}' is successfully scaled` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('reloadService', async (cb, serviceId) => {
        try {
            this.emit("serviceReloaded")
            return cb({ bool: true, msg: `Service '${serviceId}' is successfully reloaded` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('getReplicasService', async (cb, serviceId) => {
        /**
          * get number of replicas for a giving service
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (service === -1) throw `Service '${serviceId}' does not exist`
            return cb({ bool: true, msg: service.replicas })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('getModeService', async (cb, serviceId) => {
        /**
          * get number of replicas for a giving service
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (service === -1) throw `Service '${serviceId}' does not exist`
            return cb({ bool: true, msg: service.tag })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('getRunningServices', async (cb) => {
        /**
          * Find running docker services
          * @param None
          * @returns {Object}
        */
        try {
            const res = await this.db.service.findServices({ isOn: 1 })
            return cb({ bool: true, msg: res })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

}
