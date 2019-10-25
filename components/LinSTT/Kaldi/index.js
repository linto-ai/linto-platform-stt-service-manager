const debug = require('debug')(`app:linstt:kaldi`)
const fs = require('fs').promises
const rimraf = require("rimraf");
const ini = require('ini')
const exec = require('child_process').exec;
const ncp = require('ncp').ncp;
const ncpPromise = require('util').promisify(ncp)


Array.prototype.diff = function (a) {
    return this.filter(function (i) { return a.indexOf(i) < 0; });
};

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
async function sh(cmd) {
    return new Promise(function (resolve, reject) {
        try {
            exec(cmd, (err, stdout, stderr) => {
                debug(err)
                debug(stdout)
                if (err) {
                    reject('Error during language model generation');
                } else {
                    resolve(stdout);
                }
            })
        } catch (err) {
            reject(err)
        }
    });
}


class Kaldi {
    constructor() {
        this.lang = process.env.LANGUAGE.split(',')
        this.lang = this.lang.map(s => s.trim())
    }

    async getAMParams(acmodelId) {
        const content = await fs.readFile(`${process.env.AM_PATH}/${acmodelId}/decode.cfg`, 'utf-8')
        const config = ini.parse(content.replace(/:/g, '='), 'utf-8')
        const lmGenPath = `${process.env.AM_PATH}/${acmodelId}/${config.decoder_params.lmPath}`
        const lmGenOrder = config.decoder_params.lmOrder
        return { lmGenPath: lmGenPath, lmOrder: lmGenOrder }
    }

    async checkModel(modelId, type) {
        try {
            const AM = ['conf/', 'ivector_extractor/', 'decode.cfg', 'final.mdl', 'tree']
            const LMGen = ['g2p/.tool', 'g2p/model', 'dict/lexicon.txt', 'dict/extra_questions.txt', 'dict/nonsilence_phones.txt', 'dict/optional_silence.txt', 'dict/silence_phones.txt']
            const LM = ['HCLG.fst', 'words.txt']
            switch (type) {
                case 'am':
                    for (let i = 0; i < AM.length; i++)
                        await fs.stat(`${process.env.AM_PATH}/${modelId}/${AM[i]}`)
                    const params = await this.getAMParams(modelId)
                    for (let i = 0; i < LMGen.length; i++)
                        await fs.stat(`${params.lmGenPath}/${LMGen[i]}`)
                    break
                case 'lm':
                    for (let i = 0; i < LM.length; i++)
                        await fs.stat(`${process.env.LM_PATH}/${modelId}/${LM[i]}`)
                    break
            }
            return true
        } catch (err) {
            debug(err)
            return false
        }
    }

    async phonetisation(g2ptool, g2pmodel, oovFile) {
        try {
            let lex = {}
            switch (g2ptool) {
                case "phonetisaurus":
                    lex = await sh(`phonetisaurus-apply --model ${g2pmodel} --word_list ${oovFile}`)
                    break
                case 'sequitur':
                    lex = await sh(`g2p.py --encoding=utf-8 --model=${g2pmodel} --apply  ${oovFile}`)
                    break
                default:
                    debug('undefined g2p tool')
                    throw 'Error during language model generation'
            }
            lex = lex.split('\n').filter(function (el) { return el; })
            lex = lex.map(s => s.split('\t'))
            return lex
        } catch (err) {
            throw err
        }
    }

    prepareEntity(entity) {
        /**
         * Apply a set of transformations
            * convert to lowercase
            * remove duplicates
            * select entities with multiple pronunciations
         */
        let newEntity = entity.items.map(elem => elem.toLowerCase().trim())
        newEntity = [...new Set(newEntity)] //remove duplicates from list
        newEntity = newEntity.filter(function (el) { return el; }) //remove empty element from list
        const pronunciations = newEntity.map(e => { if (e.indexOf(process.env.DICT_DELIMITER) !== -1) return e; else return '' })
        newEntity = newEntity.map(e => { if (e.indexOf(process.env.DICT_DELIMITER) !== -1) return e.split(process.env.DICT_DELIMITER)[0]; else return e })
        newEntity = newEntity.sort()
        return { entity: newEntity, pron: pronunciations }
    }

    prepareIntent(intent, words) {
        /**
         * Apply a set of transformations
            * convert to lowercase
            * remove multiple spaces
            * split commands based on comma character
            * split commands based on point character
            * remove the begin-end white spaces
         */
        let newIntent = intent.items.map(elem => elem.toLowerCase().trim().split(/,|\./))
        newIntent = newIntent.flat()
        newIntent = newIntent.filter(function (el) { return el; }) //remove empty element from list
        newIntent = newIntent.map(s => s.replace(/^##.*/, '')) //remove starting character (markdown format)
        newIntent = newIntent.map(s => s.replace(/^ *- */, '')) //remove starting character (markdown format)
        newIntent = newIntent.map(s => s.replace(/\[[^\[]*\]/g, '')) //remove entity values
        newIntent = newIntent.map(s => s.replace(/\(/g, '#')) //add entity identifier
        newIntent = newIntent.map(s => s.replace(/\)/g, ' ')) //remove parenthesis
        newIntent = newIntent.map(s => s.replace(/’/g, '\'')) //replace special character
        newIntent = newIntent.map(s => s.replace(/'/g, '\' ')) //add space after quote symbol
        newIntent = newIntent.map(s => s.replace(/æ/g, 'ae')) //replace special character
        newIntent = newIntent.map(s => s.replace(/œ/g, 'oe')) //replace special character
        newIntent = newIntent.map(s => s.replace(/[^a-z àâäçèéêëîïôùûü_'\-#]/g, '')) //remove other symbols
        newIntent = newIntent.map(s => s.replace(/ +/g, ' ')) //remove double space
        newIntent = newIntent.map(s => s.trim()) //remove the begin-end white spaces
        newIntent = newIntent.filter(function (el) { return el; }) //remove empty element from list
        newIntent = newIntent.sort()


        //        intent.items.forEach((item) => {
        //            const subCmds = item.toLowerCase().replace(/ +/g, ' ').split(/,|\./).map(elem => elem.trim())
        //            const filtered = subCmds.filter(function (el) { return el; }) //remove empty element from list
        //            let newCmds = filtered.map(s => s.replace(/^ *- */, '')) //remove starting character (markdown format)
        //            newCmds = newCmds.map(s => s.replace(/\[[^\[]*\]/g, '')) //remove entity values
        //            newCmds = newCmds.map(s => s.replace(/\(/g, '#')) //add entity identifier
        //            newCmds = newCmds.map(s => s.replace(/\)/g, ' ')) //remove parenthesis
        //            newCmds = newCmds.map(s => s.replace(/’/g, '\'')) //replace special character
        //            newCmds = newCmds.map(s => s.replace(/'/g, '\' ')) //add space after quote symbol
        //            newCmds = newCmds.map(s => s.replace(/æ/g, 'ae')) //replace special character
        //            newCmds = newCmds.map(s => s.replace(/œ/g, 'oe')) //replace special character
        //            newCmds = newCmds.map(s => s.replace(/[^a-z àâäçèéêëîïôùûü_'\-#]/g, '')) //remove other symbols
        //            newCmds = newCmds.map(s => s.replace(/ +/g, ' ')) //remove double space
        //            newCmds = newCmds.map(s => s.trim()) //remove the begin-end white spaces
        //            newCmds = newCmds.filter(function (el) { return el; }) //remove empty element from list
        //            newIntent.push(newCmds)
        //        })
        //
        //        newIntent = newIntent.sort()


        /**
         * match the commands vocab with the defined lexicon
         * use the initialized word list and find each sequence of words in the commande
         */
        let cmd = newIntent.flat().join(' \n ')
        cmd = ` ${cmd} `
        words.forEach(word => {
            if (cmd.indexOf(word.seq) !== -1)
                cmd = cmd.replace(` ${word.seq} `, ` ${word.org} `)
        })
        newIntent = cmd.trim().split(' \n ').map(elem => elem.trim()) //re-build list

        /**
         * remove sub-commands
         */
        for (let i = 0; i < newIntent.length; i++)
            for (let j = 0; j < newIntent.length; j++)
                if (i !== j && ` ${newIntent[i]} `.indexOf(` ${newIntent[j]} `) !== -1) {
                    newIntent[i] = ""
                    break
                }
        newIntent = newIntent.filter(function (el) { return el; }) //remove empty element from list
        newIntent = newIntent.sort()
        return newIntent
    }

    async prepare_HCLG(lexiconFilePath, entities, intents, intentsFile, entitypath) {
        let lexicon = [] //lexicon (words + pronunciation)
        let words = [] //all list of words
        let specwords = [] //words with symbol '-'
        let newIntent = []
        let entityname = []
        let pronunciations = []
        let fullVocab = []

        //prepare lexicon and words
        const content = await fs.readFile(lexiconFilePath, 'utf-8')
        const lexiconFile = content.split('\n')
        lexiconFile.forEach((curr) => {
            const e = curr.trim().replace('\t', ' ').split(' ')
            const filtered = e.filter(function (el) { return el; })
            const item = filtered[0]
            if (item !== undefined) {
                filtered.shift()
                lexicon.push([item, filtered.join(' ')])
                words.push(item)
                if (item.indexOf('-') !== -1) {
                    specwords.push({ seq: [item.replace(/-/g, " ")], org: item })
                }
            }
        })

        //prepare intents
        intents.forEach((intent) => {
            newIntent.push(this.prepareIntent(intent, specwords))
        })
        newIntent = newIntent.flat()
        if (newIntent.length === 0)
            throw 'No command found'
        fullVocab.push(newIntent.join(' ').split(' '))
        await fs.writeFile(intentsFile, newIntent.join('\n'), 'utf-8', (err) => { throw err })

        //prepare entities
        entities.forEach((entity) => {
            entityname.push(entity.name)
            const newEntity = this.prepareEntity(entity)
            if (newEntity.entity.length === 0) throw `The entity ${entity.name} is empty (either remove it or update it)`
            pronunciations.push(newEntity.pron)
            fullVocab.push(newEntity.entity.join(' ').split(' '))
            fs.writeFile(`${entitypath}/${entity.name}`, newEntity.entity.join('\n') + '\n', 'utf-8', (err) => { throw err })
        })
        pronunciations = pronunciations.flat().filter(function (el) { return el; })

        //check entities
        let listentities = newIntent.join(' ').split(' ').filter(word => word.indexOf('#') !== -1)
        listentities = listentities.map(w => w.replace(/#/, ''))
        listentities = listentities.filter((v, i, a) => a.indexOf(v) === i)
        const diff = listentities.diff(entityname)
        if (diff.length !== 0) throw `This list of entities are not yet created: [${diff}]`
        await fs.writeFile(`${entitypath}/.entities`, listentities.join('\n'), 'utf-8', (err) => { throw err })
        listentities = listentities.map(s => { return `#nonterm:${s}` })
        return { lexicon, words, fullVocab, pronunciations, listentities }
    }

    async generate_HCLG(entities, intents, acmodelId, lgmodelId) {
        //get acoustic model parameters
        const params = await this.getAMParams(acmodelId)
        /** Configuration Section */
        /** ****************** */
        const tmplmpath = `${process.env.TEMP_FILE_PATH}/${lgmodelId}` //temporary LM path
        const entitypath = `${tmplmpath}/fst` //folder where the normalized entities will be saved
        const lexiconpath = `${tmplmpath}/lexicon` //folder where to save the new lexicon including the oov
        const dictpath = `${tmplmpath}/dict` //folder to save the new dictionary
        const langpath = `${tmplmpath}/lang` //folder to save the new lang files
        const intentsFile = `${tmplmpath}/text` //LM training file path
        const lexiconFile = `${dictpath}/lexicon.txt` //new lexicon file
        const nonterminalsFile = `${dictpath}/nonterminals.txt` //nonterminals file
        const pronunciationFile = `${tmplmpath}/pronunciations` //words with different pronunciations
        const g2ptool = await fs.readFile(`${params.lmGenPath}/g2p/.tool`, 'utf-8')
        const g2pmodel = `${params.lmGenPath}/g2p/model`
        const dictgenpath = `${params.lmGenPath}/dict`
        const lexicongenfile = `${params.lmGenPath}/dict/lexicon.txt`
        const oovFile = `${lexiconpath}/oov`
        /** ****************** */

        let exist = await fs.stat(tmplmpath).then(async () => { return true }).catch(async () => { return false })
        if (exist) { await new Promise((resolve, reject) => { rimraf(tmplmpath, async (err) => { if (err) reject(err); resolve() }); }) }
        await fs.mkdir(tmplmpath) //create the temporary LM folder
        await fs.mkdir(entitypath) //create the fst folder
        await ncpPromise(dictgenpath, dictpath) //copy the dict folder
        //await fs.mkdir(dictpath) //create the dict folder
        await fs.mkdir(langpath) //create the langprep folder
        await fs.mkdir(lexiconpath) //create the lexicon folder
        let { lexicon, words, fullVocab, pronunciations, listentities } = await this.prepare_HCLG(lexicongenfile, entities, intents, intentsFile, entitypath)

        // Prepare OOV words
        fullVocab = [...new Set(fullVocab.flat())] //remove duplicates from list
        fullVocab = fullVocab.map(s => { if (s.indexOf('#') === -1) return s })
        fullVocab = fullVocab.filter(function (el) { return el; })
        fullVocab = fullVocab.sort()
        const oov = fullVocab.diff(words)
        if (oov.length !== 0) {
            await fs.writeFile(oovFile, oov.join('\n'), 'utf-8', (err) => { throw err })
            const oov_lex = await this.phonetisation(g2ptool.trim(), g2pmodel, oovFile)
            if (oov_lex.length !== oov.length) {
                debug('Error occured during generating pronunciations for new words')
                throw 'Error during language model generation'
            }
            lexicon = lexicon.concat(oov_lex)
        }

        // Prepare multiple pronunciations
        if (pronunciations.length !== 0) {
            for (let i = 0; i < pronunciations.length; i++) {
                const words = pronunciations[i].split(process.env.DICT_DELIMITER)
                const org = words[0]
                words.shift()
                await fs.writeFile(pronunciationFile, words.join('\n'), { encoding: 'utf-8', flag: 'w' })
                let pronon_lex = await this.phonetisation(g2ptool.trim(), g2pmodel, pronunciationFile)
                pronon_lex = pronon_lex.map(s => { s[0] = org; return s })
                lexicon = lexicon.concat(pronon_lex)
            }
        }
        lexicon = lexicon.map(s => { return `${s[0]}\t${s[1]}` })
        lexicon = [...new Set(lexicon)]
        lexicon = lexicon.sort()

        // save the new lexicon
        await fs.writeFile(lexiconFile, `${lexicon.join('\n')}\n`, { encoding: 'utf-8', flag: 'w' })
        // create nonterminals file
        if (listentities.length !== 0)
            await fs.writeFile(nonterminalsFile, listentities.join('\n'), { encoding: 'utf-8', flag: 'w' })
        // remove lexiconp.txt if exist
        exist = await fs.stat(`${dictpath}/lexiconp.txt`).then(async () => { return true }).catch(async () => { return false })
        if (exist)
            await fs.unlink(`${dictpath}/lexiconp.txt`)

        const scriptShellPath = `${process.cwd()}/components/LinSTT/Kaldi/scripts`
        const cmd = `cd ${scriptShellPath}; ./prepare_HCLG.sh ${process.env.AM_PATH}/${acmodelId} ${process.env.LM_PATH}/${lgmodelId} ${params.lmGenPath} ${tmplmpath}`
        await sh(cmd)
        rimraf(tmplmpath, async (err) => { if (err) throw err })
        return oov
    }
}

module.exports = new Kaldi()