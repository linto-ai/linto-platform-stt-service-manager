const Component = require(`../component.js`)
const debug = require('debug')(`app:linstt`)
const compressing = require('compressing');

const am = require(`${process.cwd()}/models/AMUpdates`)
const lm = require(`${process.cwd()}/models/LMUpdates`)
const service = require(`${process.cwd()}/models/ServiceUpdates`)

class LinSTT extends Component {
    constructor(app) {
        super(app)
        this.id = this.constructor.name
        this.app = app
        this.db = { am: am, lm: lm, service: service }
        switch (process.env.LINSTT_SYS) {
            case 'kaldi':
                this.stt = require(`./Kaldi`)
                break
            case '': this.stt = ''; break
            default: throw 'Undefined LinSTT system'
        }
        return this.init()
    }

    /**
     * Other functions used by Acoustic and Language Model events
     */
    async uncompressFile(type, src, dest) {
        return new Promise(async (resolve, rejection) => {
            try {
                switch (type) {
                    case 'application/zip': // .zip
                        await compressing.zip.uncompress(src, dest); break
                    case 'application/gzip': // .tar.gz
                        await compressing.tar.uncompress(src, dest); break
                    case 'application/x-gzip': // .tar.gz
                        await compressing.tgz.uncompress(src, dest); break
                    default:
                        rejection('Undefined file format. Please use one of the following format: zip or tar.gz')
                }
                resolve('uncompressed')
            } catch (err) {
                rejection(err)
            }
        })
    }

    async checkExists(payload, type, isTrue) {
        const res = await this.db.lm.findModel(payload.modelId)
        if (res === -1)
            throw `Language Model '${payload.modelId}' does not exist`
        if (isTrue) {
            return new Promise((resolve, rejection) => {
                res[type].forEach((obj, idx) => {
                    obj.idx = idx
                    if (obj.name === payload.name)
                        resolve(obj)
                })
                rejection(`${payload.name} does not exist`)
            })
        } else {
            return new Promise((resolve, rejection) => {
                res[type].forEach((obj) => {
                    if (obj.name === payload.name)
                        rejection(`${payload.name} already exists`)
                })
                resolve()
            })
        }
    }

    async generateModel(res,db) {
        try {
            let data = {}
            await this.stt.prepareParam(res.acmodelId, res.modelId).then(async ()=>{
                debug(`done prepareParam (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 1
                await db.updateModel(res.modelId, data)
            })
            await this.stt.prepare_lex_vocab().then(async ()=>{
                debug(`done prepare_lex_vocab (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 3
                await db.updateModel(res.modelId, data)
            })
            await this.stt.prepare_intents(res.intents).then(async ()=>{
                debug(`done prepare_intents (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 8
                await db.updateModel(res.modelId, data)
            })
            await this.stt.prepare_entities(res.entities).then(async ()=>{
                debug(`done prepare_entities (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 13
                await db.updateModel(res.modelId, data)
            })

            this.stt.check_entities()
            debug(`done check_entities (${this.stt.tmplmpath})`)

            await this.stt.prepare_new_lexicon().then(async ()=>{
                debug(`done prepare_new_lexicon (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 15
                await db.updateModel(res.modelId, data)
            })
            await this.stt.generate_arpa().then(async ()=>{
                debug(`done generate_arpa (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 20
                await db.updateModel(res.modelId, data)
            })
            await this.stt.prepare_lang().then(async ()=>{
                debug(`done prepare_lang (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 60
                await db.updateModel(res.modelId, data)
            })
            this.stt.generate_main_and_entities_HCLG(res.acmodelId)
            await this.stt.check_previous_HCLG_creation().then(async ()=>{
                debug(`done generate_main_and_entities_HCLG (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 90
                await db.updateModel(res.modelId, data)
            })
            await this.stt.generate_final_HCLG(res.modelId).then(async ()=>{
                debug(`done generate_final_HCLG (${this.stt.tmplmpath})`)
                data = {}
                data.updateState = 100
                await db.updateModel(res.modelId, data)
            })
            this.stt.removeTmpFolder()

            data = {}
            data.isGenerated = 1
            data.updateState = 0
            data.isDirty = 0
            data.oov = this.stt.oov
            data.updateStatus = `Language model '${res.modelId}' is successfully generated`
            await db.updateModel(res.modelId, data)
        } catch (err) {
            this.stt.removeTmpFolder()
            let data = {}
            data.updateState = -1
            data.updateStatus = `Language model '${res.modelId}' is not generated. ERROR: ${err}`
            await db.updateModel(res.modelId, data)
        }
    }
}

module.exports = app => new LinSTT(app)
