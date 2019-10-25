const debug = require('debug')(`app:linstt:eventsFrom:WebServer`)
const fs = require('fs').promises
const rimraf = require("rimraf");
const download = require('download');
const ncp = require('ncp').ncp;
const ncpPromise = require('util').promisify(ncp)
const datetime = require('node-datetime')

/**
 * apiAModel.js
 * 
const debug = require('debug')(`app:linstt:apiamodel`)
const fs = require('fs').promises
const rimraf = require("rimraf");
const compressing = require('compressing');
const download = require('download');
 *
 *
*/

/**
 * apiLModel.js
 * 
const debug = require('debug')(`app:linstt:apilmodel`)
const fs = require('fs').promises
const rimraf = require("rimraf");
const compressing = require('compressing');
const download = require('download');
const ncp = require('ncp').ncp;
const ncpPromise = require('util').promisify(ncp)
 *
 *
*/

/**
 * apiElement.js
 * 
const debug = require('debug')(`app:linstt:apielement`)
const fs = require('fs').promises
 *
 *
*/



// this is bound to the component
module.exports = function () {
    if (!this.app.components['WebServer']) return


    /**
     * Language Model events from WebServer
     *      createLModel
     *      deleteLModel
     *      getLModel
     *      getLModels
     */
    this.app.components['WebServer'].on('createLModel', async (cb, payload) => {
        try {
            const destPath = `${process.env.LM_PATH}/${payload.modelId}`
            const res = await this.db.lm.findModel(payload.modelId)
            let amodel = {}
            if (res != -1)
                throw `Language Model '${payload.modelId}' exists`
            if (payload.acousticModel != undefined) {
                amodel = await this.db.am.findModel(payload.acousticModel)
                if (amodel === -1)
                    throw `Acoustic Model '${payload.acousticModel}' does not exist`
            } else if (payload.lang != undefined) {
                if (this.stt.lang.indexOf(payload.lang) === -1) throw `${payload.lang} is not a valid language`
                amodel = await this.db.am.findModels({ lang: payload.lang })
                if (amodel === -1)
                    throw `No Acoustic Model are found for the input language '${payload.lang}'`
                amodel = amodel[amodel.length - 1]
                payload.acousticModel = amodel.modelId
            } else return cb({ bool: false, msg: `'acousticModel' parameter or 'lang' parameter is requared` })
            if (payload.file != undefined) {
                await this.uncompressFile(payload.file.mimetype, payload.file.path, destPath)
                await fs.unlink(payload.file.path)
            } else if (payload.link != undefined) {
                const response = await download(payload.link, destPath, { extract: true })
                if (!Array.isArray(response)) {
                    rimraf(destPath, async (err) => { if (err) throw err; }) //remove folder
                    return cb({ bool: false, msg: 'Inappropriate file type or format. zip and tar.gz are accepted' })
                }
            } else if (payload.lmodelId != undefined) {
                const res = await this.db.lm.findModel(payload.lmodelId)
                if (res === -1)
                    throw `Language Model '${payload.lmodelId}' does not exist`
                await ncpPromise(`${process.env.LM_PATH}/${payload.lmodelId}`, destPath, async (err) => {
                    if (err) throw err
                })
            } else {
                await this.db.lm.createModel(payload.modelId, payload.acousticModel, amodel.lang, 0, 0)
                if (payload.data !== undefined) {
                    if (payload.data.intents !== undefined)
                        for (let i = 0; i < payload.data.intents.length; i++) {
                            const curr = payload.data.intents[i]
                            if (curr.name !== undefined && curr.items !== undefined && curr.items.length !== 0) {
                                await this.checkExists({ modelId: payload.modelId, name: curr.name }, 'intents', false)
                                    .catch(async (err) => {
                                        await this.db.lm.deleteModel(payload.modelId)
                                        throw 'The model data are invalid (' + err + ')'
                                    })
                                await this.db.lm.pushType(payload.modelId, 'intents', curr)
                            } else {
                                await this.db.lm.deleteModel(payload.modelId)
                                throw 'The model data are invalid'
                            }
                        }
                    if (payload.data.entities !== undefined)
                        for (let i = 0; i < payload.data.entities.length; i++) {
                            const curr = payload.data.entities[i]
                            if (curr.name !== undefined && curr.items !== undefined && curr.items.length !== 0) {
                                await this.checkExists({ modelId: payload.modelId, name: curr.name }, 'entities', false)
                                    .catch(async (err) => {
                                        await this.db.lm.deleteModel(payload.modelId)
                                        throw 'The model data are invalid (' + err + ')'
                                    })
                                await this.db.lm.pushType(payload.modelId, 'entities', curr)
                            } else {
                                await this.db.lm.deleteModel(payload.modelId)
                                throw 'The model data are invalid'
                            }
                        }
                }
                await fs.mkdir(destPath)
                return cb({ bool: true, msg: `An empty Language Model '${payload.modelId}' is successfully created` })
            }

            const check = await this.stt.checkModel(payload.modelId, 'lm')
            if (check) {
                await this.db.lm.createModel(payload.modelId, payload.acousticModel, amodel.lang, 1)
                return cb({ bool: true, msg: `Language Model '${payload.modelId}' is successfully created` })
            } else {
                rimraf(destPath, async (err) => { if (err) throw err; }) //remove folder
                return cb({ bool: false, msg: 'This is not a valid model' })
            }
        } catch (err) {
            if (payload.file != undefined) await fs.unlink(payload.file.path)
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('deleteLModel', async (cb, modelId) => {
        try {
            const res = await this.db.lm.deleteModel(modelId)
            if (res === -1)
                throw `Language Model '${modelId}' does not exist`
            rimraf(`${process.env.LM_PATH}/${modelId}`, async (err) => { if (err) throw err; }) //remove folder
            return cb({ bool: true, msg: `Language Model '${modelId}' is successfully removed` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('getLModel', async (cb, modelId) => {
        try {
            const res = await this.db.lm.findModel(modelId)
            if (res === -1)
                throw `Language Model '${modelId}' does not exist`
            return cb({ bool: true, msg: res })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('getLModels', async (cb) => {
        try {
            const res = await this.db.lm.findModels()
            if (res === -1)
                throw `No language model has been created`
            let models = []
            new Promise((resolve, reject) => {
                res.forEach((model) => {
                    let intents = model.intents.map(obj => { return obj.name })
                    let entities = model.entities.map(obj => { return obj.name })
                    model.intents = intents
                    model.entities = entities
                    models.push(model)
                })
                resolve()
            })
            return cb({ bool: true, msg: models })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('generateLModel', async (cb, modelId) => {
        try {
            const res = await this.db.lm.findModel(modelId)
            if (res === -1)
                throw `Language Model '${modelId}' does not exist`
            if (res.isDirty === 0 && res.isGenerated === 1)
                throw `Language Model '${modelId}' is already generated and is up-to-date`
            const oov = await this.stt.generate_HCLG(res.entities, res.intents, res.acmodelId, modelId)
            await this.db.lm.updateModel(modelId, { isGenerated: 1, isDirty: 0, dateGen: datetime.create().format('m/d/Y-H:M:S') })
            await this.db.service.updateServicebyParam({ LModelId: modelId }, { isDirty: 1 })
            return cb({ bool: true, msg: `Language Model '${modelId}' is generated successfully. Check the following out-of-vocabulary words: ${oov}` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })






    /**
     * Acoustic Model events from WebServer
     *      createAModel
     *      deleteAModel
     *      getAModel
     *      getAModels
     */
    this.app.components['WebServer'].on('createAModel', async (cb, payload) => {
        try {
            const destPath = `${process.env.AM_PATH}/${payload.modelId}`
            const res = await this.db.am.findModel(payload.modelId)
            if (res != -1)
                throw `Acoustic Model '${payload.modelId}' exists`
            if (payload.lang === undefined) throw '\'lang\' parameter is requared'
            if (this.stt.lang.indexOf(payload.lang) === -1) throw `${payload.lang} is not a valid language`

            if (payload.file != undefined) {
                await this.uncompressFile(payload.file.mimetype, payload.file.path, destPath)
                await fs.unlink(payload.file.path)
            } else if (payload.link != undefined) {
                const response = await download(payload.link, destPath, { extract: true })
                if (!Array.isArray(response)) {
                    rimraf(destPath, async (err) => { if (err) throw err; }) //remove folder
                    throw 'Inappropriate file type or format. zip and tar.gz are accepted'
                }
            } else throw '\'link\' or \'file\' parameter is requared'
            const check = await this.stt.checkModel(payload.modelId, 'am')
            if (check) {
                await this.db.am.createModel(payload.modelId, payload.lang, payload.desc)
                return cb({ bool: true, msg: `Acoustic Model '${payload.modelId}' is successfully created` })
            } else {
                rimraf(destPath, async (err) => { if (err) throw err; }) //remove folder
                throw 'This is not a valid model'
            }
        } catch (err) {
            await fs.unlink(payload.file.path)
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('deleteAModel', async (cb, modelId) => {
        try {
            const check = await this.db.lm.findModels({ acmodelId: modelId })
            if (check != -1) throw `There are language models (${check.length}) that use the acoustic model '${modelId}'`
            const res = await this.db.am.deleteModel(modelId)
            if (res === -1)
                throw `Acoustic Model '${modelId}' does not exist`
            rimraf(`${process.env.AM_PATH}/${modelId}`, async (err) => { if (err) throw err; }) //remove folder
            return cb({ bool: true, msg: `Acoustic Model '${modelId}' is successfully removed` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('getAModel', async (cb, modelId) => {
        try {
            const res = await this.db.am.findModel(modelId)
            if (res === -1)
                throw `Acoustic Model '${modelId}' does not exist`
            return cb({ bool: true, msg: res })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('getAModels', async (cb) => {
        try {
            const res = await this.db.am.findModels()
            if (res === -1)
                throw `No acoustic model has been created`
            return cb({ bool: true, msg: res })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })



    /**
     * Entity/Intent events from WebServer
     *      createType
     *      deleteType
     *      updateType
     *      getType
     *      getTypes
     */
    this.app.components['WebServer'].on('createType', async (cb, payload, type) => {
        /**
        this.emit('create', payload, type, async (err) => {
            if (err) {
                if (payload.file != undefined) await fs.unlink(payload.file.path)
                return cb({ bool: false, msg: err })
            }
            return cb({ bool: true, msg: `${payload.name} is successfully added to language model '${payload.modelId}'` })
        })
        */

        try {
            const data = {}
            await this.checkExists(payload, type, false)
            if (payload.file != undefined) {
                const content = await fs.readFile(payload.file.path, 'utf-8')
                data.name = payload.name
                data.items = content.split('\n')
                await fs.unlink(payload.file.path)
            } else if (payload.content.length != undefined && payload.content.length != 0) {
                data.name = payload.name
                data.items = payload.content
            } else throw `'file' parameter or a JSON body (liste of values) is required`
            if (data.items.length === 0) throw `${payload.name} is empty`
            await this.db.lm.pushType(payload.modelId, type, data)
            return cb({ bool: true, msg: `${payload.name} is successfully added to language model '${payload.modelId}'` })
        } catch (err) {
            if (payload.file != undefined) await fs.unlink(payload.file.path)
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('deleteType', async (cb, payload, type) => {
        try {
            await this.checkExists(payload, type, true)
            await this.db.lm.pullType(payload.modelId, type, payload.name)
            return cb({ bool: true, msg: `${payload.name} is successfully removed from language model '${payload.modelId}'` })
        } catch (err) {
            if (payload.file != undefined) await fs.unlink(payload.file.path)
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('updateType', async (cb, payload, type, update) => {
        try {
            const obj = await this.checkExists(payload, type, true)
            if (payload.file != undefined) {
                const content = await fs.readFile(payload.file.path, 'utf-8')
                tmp = content.split('\n')
                await fs.unlink(payload.file.path)
            } else if (payload.content.length != undefined && payload.content.length != 0) {
                tmp = payload.content
            } else throw `'file' parameter or a JSON body (liste of values) is required`
            switch (update) {
                case 'put':
                    break
                case 'patch':
                    tmp = obj.items.concat(tmp)
                    tmp = [...new Set(tmp)]
                    break
                default: throw `Undefined update parameter from 'updateType' eventEmitter`
            }
            const data = {}
            if (tmp.length === 0) throw `${payload.name} is empty`
            data[`${type}.${obj.idx}.items`] = tmp
            data.isDirty = 1
            await this.db.lm.updateModel(payload.modelId, data)
            return cb({ bool: true, msg: `${payload.name} is successfully updated in language model '${payload.modelId}'` })
        } catch (err) {
            if (payload.file != undefined) await fs.unlink(payload.file.path)
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('getType', async (cb, payload, type) => {
        try {
            const obj = await this.checkExists(payload, type, true)
            return cb({ bool: true, msg: obj.items })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })
    this.app.components['WebServer'].on('getTypes', async (cb, modelId, type) => {
        try {
            const res = await this.db.lm.findModel(modelId)
            if (res === -1)
                throw `Language Model '${modelId}' does not exist`
            return cb({ bool: true, msg: res[type] })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

}
