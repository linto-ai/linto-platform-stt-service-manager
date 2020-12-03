const debug = require('debug')('app:model:serviceupdates')
const datetime = require('node-datetime')
const MongoModel = require(`${process.cwd()}/models/model.js`)

class ServiceUpdates extends MongoModel {
    constructor() {
       super('Services') // "context" est le nom de ma collection
    }

    //create a new instance
    async createService(obj) {
        let newService = {
            serviceId: obj.serviceId,
            tag: obj.tag,
            replicas: obj.replicas,
            LModelId: obj.LModelId,
            AModelId: obj.AModelId,
            externalAccess: obj.externalAccess,
            lang: obj.lang,
            isOn: 0,
            date: datetime.create().format('m/d/Y-H:M:S')
        }
        return await this.mongoInsert(newService)
    }

    // find service by name
    async findService(serviceId) {
        try {
            const service = await this.mongoRequest({ serviceId: serviceId })
            if (service.length == 0) return false
            else return service[0]
        } catch (err) {
            console.error("ERROR: " + err)
            return err
        }
    }

    // find all services
    async findServices(request = {}) {
        try {
            return await this.mongoRequest(request)
        } catch (err) {
            console.error("ERROR: " + err)
            return err
        }
    }

    // update service by name
    async updateService(id, obj) {
        try {
            obj.date = datetime.create().format('m/d/Y-H:M:S')
            return await this.mongoUpdate({ serviceId: id }, obj)
        } catch (err) {
            console.error("ERROR: " + err)
            return err
        }
    }

    // delete service by name
    async deleteService(serviceId) {
        try {
            return await this.mongoDelete({ serviceId: serviceId })
        } catch (err) {
            console.error("ERROR: " + err)
            return err
        }
    }
}

module.exports = new ServiceUpdates()
