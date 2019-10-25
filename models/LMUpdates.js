const debug = require('debug')('app:model:LMupdate')
const datetime = require('node-datetime')
const query = require(`${process.cwd()}/models/MongoDB`)

class LMUpdates {
    constructor() {
        this.DB = process.env.MONGODB_DBNAME_SMANAGER
        this.collection = 'LangModels'
    }

    //create a new instance
    async createModel(modelName, acName = "", lang = "", isGenerated = 0, isDirty = 0, entities = [], intents = []) {
        let newModel = {
            modelId: modelName,
            acmodelId: acName,
            entities: entities,
            intents: intents,
            lang: lang,
            isGenerated: isGenerated,
            isDirty: isDirty,
            date: datetime.create().format('m/d/Y-H:M:S'),
            dateGen: null
        }
        return await query.findOne(this.DB, this.collection, { modelId: modelName }).then(async (model) => {
            if (model === null) return await query.insertOne(this.DB, this.collection, newModel)
            return -1
        })
    }

    // delete language model by name
    async deleteModel(modelName) {
        return await query.findOne(this.DB, this.collection, { modelId: modelName }).then(async (model) => {
            if (model === null)
                return -1
            return await query.deleteOne(this.DB, this.collection, { modelId: modelName })
        })
    }

    // find language model by name
    async findModel(modelName) {
        return await query.findOne(this.DB, this.collection, { modelId: modelName }).then(async (model) => {
            if (model === null)
                return -1
            return model
        })
    }

    // find all language models
    async findModels(request = {}) {
        return await query.findMany(this.DB, this.collection, request).then(async (models) => {
            if (models.length === 0)
                return -1
            return models
        })
    }

    async updateModel(modelName, obj) {
        return await query.findOne(this.DB, this.collection, { modelId: modelName }).then(async (model) => {
            if (model === null)
                return -1
            obj.date = datetime.create().format('m/d/Y-H:M:S')
            return await query.updateOne(this.DB, this.collection, { modelId: modelName }, { mode: '$set', value: obj })
        })
    }

    // Update a single entity/intent by model modelId
    async pushType(modelName, element, value) {
        const id = { modelId: modelName }
        const set = { date: datetime.create().format('m/d/Y-H:M:S'), isDirty: 1 }
        const type = {}
        type[element] = value //intent or entity
        return await query.updateOne(this.DB, this.collection, id, { mode: '$set', value: set }, { mode: '$push', value: type })
    }

    // remove a single entity/intent by model modelId
    async pullType(modelName, element, name) {
        const id = { modelId: modelName }
        const set = { date: datetime.create().format('m/d/Y-H:M:S'), isDirty: 1 }
        const type = {}
        type[element] = { name: name } //intent or entity
        return await query.updateOne(this.DB, this.collection, id, { mode: '$set', value: set }, { mode: '$pull', value: type })
    }

    // remove all entities/intents by model modelId
    async deleteType(modelName) {
        const id = { modelId: modelName }
        const request = {}
        request.date = datetime.create().format('m/d/Y-H:M:S')
        request.isDirty = 1
        request[this.type] = [] //intent or entity
        return await query.updateOne(this.DB, this.collection, id, { mode: '$set', value: request })
    }

    // update model state(isGenerated) by model modelId
    async updateModelState(modelName) {
        const id = { modelId: modelName }
        const state = { isGenerated: 1 }
        return await query.updateOne(this.DB, this.collection, id, { mode: '$set', value: state })
    }

    // get model state(isGenerated) by model modelId
    async getModelState(modelName) {
        return await query.findOne(this.DB, this.collection, { modelId: modelName }).then(async (model) => {
            if (model === null)
                return -1
            return parseInt(model.isGenerated)
        })
    }

    // remove collection
    async dropCollection() {
        return await query.dropCollection(this.DB, this.collection)
    }

}

module.exports = new LMUpdates()