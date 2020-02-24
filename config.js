const debug = require('debug')('app:config')
const dotenv = require('dotenv')
const fs = require('fs')

function ifHasNotThrow(element, error) {
    if (!element) throw error
    return element
}

function ifHas(element, defaultValue) {
    if (!element) return defaultValue
    return element
}

function configureDefaults() {
    try {
        dotenv.config() // loads process.env from .env file (if not specified by the system)
        const envdefault = dotenv.parse(fs.readFileSync('.defaultparam')) // default usable values
        process.env.COMPONENTS = ifHas(process.env.COMPONENTS, envdefault.COMPONENTS)
        process.env.WEBSERVER_HTTP_PORT = ifHas(process.env.WEBSERVER_HTTP_PORT, envdefault.WEBSERVER_HTTP_PORT)
        process.env.FILESYSTEM = ifHasNotThrow(process.env.FILESYSTEM, 'No FILESYSTEM param found. Please edit ".env" file')
        process.env.SAVE_MODELS_PATH = ifHas(process.env.SAVE_MODELS_PATH, envdefault.SAVE_MODELS_PATH)
        process.env.LM_FOLDER_NAME = ifHas(process.env.LM_FOLDER_NAME, envdefault.LM_FOLDER_NAME)
        process.env.LM_PATH = `${process.env.SAVE_MODELS_PATH}/${process.env.LM_FOLDER_NAME}`
        process.env.AM_FOLDER_NAME = ifHas(process.env.AM_FOLDER_NAME, envdefault.AM_FOLDER_NAME)
        process.env.AM_PATH = `${process.env.SAVE_MODELS_PATH}/${process.env.AM_FOLDER_NAME}`
        process.env.TEMP_FOLDER_NAME = ifHas(process.env.TEMP_FOLDER_NAME, envdefault.TEMP_FOLDER_NAME)
        process.env.TEMP_FILE_PATH = `${process.env.SAVE_MODELS_PATH}/${process.env.TEMP_FOLDER_NAME}`
        process.env.WHITELIST_DOMAINS = ifHasNotThrow(process.env.WHITELIST_DOMAINS, 'No whitelist found. Please edit ".env" file')
        
        //Dictionary parameters
        process.env.DICT_DELIMITER = ifHas(process.env.DICT_DELIMITER, envdefault.DICT_DELIMITER)
        process.env.LANGUAGE = ifHas(process.env.LANGUAGE, envdefault.LANGUAGE)
        process.env.NGRAM = ifHas(process.env.NGRAM, envdefault.NGRAM)

        //MongoDB
        process.env.MONGODB_HOST = ifHas(process.env.MONGODB_HOST, envdefault.MONGODB_HOST)
        process.env.MONGODB_PORT = ifHas(process.env.MONGODB_PORT, envdefault.MONGODB_PORT)
        process.env.MONGODB_DBNAME_SMANAGER = ifHas(process.env.MONGODB_DBNAME_SMANAGER, envdefault.MONGODB_DBNAME_SMANAGER)
        process.env.MONGODB_REQUIRE_LOGIN = ifHas(process.env.MONGODB_REQUIRE_LOGIN, envdefault.MONGODB_REQUIRE_LOGIN)
        process.env.MONGODB_USER = ifHas(process.env.MONGODB_USER, envdefault.MONGODB_USER)
        process.env.MOGODB_PSWD = ifHas(process.env.MOGODB_PSWD, envdefault.MOGODB_PSWD)

        //Cluster Manager
        process.env.CLUSTER_TYPE = ifHas(process.env.CLUSTER_TYPE, envdefault.CLUSTER_TYPE)
        //Ingress Controller
        process.env.INGRESS_CONTROLLER = ifHas(process.env.INGRESS_CONTROLLER, envdefault.INGRESS_CONTROLLER)

        //NGINX
        process.env.NGINX_CONF_PATH = ifHas(process.env.NGINX_CONF_PATH, envdefault.NGINX_CONF_PATH)
        process.env.NGINX_SERVICE_ID = ifHas(process.env.NGINX_SERVICE_ID, envdefault.NGINX_SERVICE_ID)

        //DOCKER SWARM
        process.env.DOCKER_SOCKET_PATH = ifHas(process.env.DOCKER_SOCKET_PATH, envdefault.DOCKER_SOCKET_PATH)
        process.env.DOCKER_EXTERNAL_NET = ifHas(process.env.DOCKER_EXTERNAL_NET, envdefault.DOCKER_EXTERNAL_NET)
        process.env.DOCKER_TIMEOUT = ifHas(process.env.DOCKER_TIMEOUT, envdefault.DOCKER_TIMEOUT)

        //LINSTT
        process.env.LINSTT_SYS = ifHas(process.env.LINSTT_SYS, envdefault.LINSTT_SYS)
        process.env.LINSTT_IMAGE = ifHas(process.env.LINSTT_IMAGE, envdefault.LINSTT_IMAGE)
        process.env.LINSTT_PORT = ifHas(process.env.LINSTT_PORT, envdefault.LINSTT_PORT)


        //create the AM folder if it does not exist
        if (!fs.existsSync(process.env.AM_PATH))
            fs.mkdirSync(process.env.AM_PATH)

        //create the LM folder if it does not exist
        if (!fs.existsSync(process.env.LM_PATH))
            fs.mkdirSync(process.env.LM_PATH)

        //create the TMP folder if it does not exist
        if (!fs.existsSync(process.env.TEMP_FILE_PATH))
            fs.mkdirSync(process.env.TEMP_FILE_PATH)

        //process.env.COMPONENTS = ifHasNotThrow(process.env.COMPONENTS, Error("No COMPONENTS env_var specified"))
    } catch (e) {
        console.error(debug.namespace, e)
        process.exit(1)
    }
}
module.exports = configureDefaults()
