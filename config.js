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
        process.env.COMPONENTS = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_COMPONENTS, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_COMPONENTS)
        process.env.WEBSERVER_HTTP_PORT = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_HTTP_PORT, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_HTTP_PORT)
        process.env.SAVE_MODELS_PATH = ifHas(process.env.SAVE_MODELS_PATH, envdefault.SAVE_MODELS_PATH)
        process.env.LM_FOLDER_NAME = ifHas(process.env.LM_FOLDER_NAME, envdefault.LM_FOLDER_NAME)
        process.env.LM_PATH = `${process.env.SAVE_MODELS_PATH}/${process.env.LM_FOLDER_NAME}`
        process.env.AM_FOLDER_NAME = ifHas(process.env.AM_FOLDER_NAME, envdefault.AM_FOLDER_NAME)
        process.env.AM_PATH = `${process.env.SAVE_MODELS_PATH}/${process.env.AM_FOLDER_NAME}`
        process.env.TEMP_FOLDER_NAME = ifHas(process.env.TEMP_FOLDER_NAME, envdefault.TEMP_FOLDER_NAME)
        process.env.TEMP_FILE_PATH = `${process.env.SAVE_MODELS_PATH}/${process.env.TEMP_FOLDER_NAME}`
        process.env.FILESYSTEM = ifHasNotThrow(process.env.LINTO_STACK_STT_SERVICE_MANAGER_DIRECTORY, 'No LINTO_STACK_STT_SERVICE_MANAGER_DIRECTORY found. Please edit ".env" file')

        //Dictionary parameters
        process.env.DICT_DELIMITER = ifHas(process.env.DICT_DELIMITER, envdefault.DICT_DELIMITER)
        process.env.LANGUAGE = ifHas(process.env.LANGUAGE, envdefault.LANGUAGE)
        process.env.NGRAM = ifHas(process.env.NGRAM, envdefault.NGRAM)

        //Cluster Manager
        process.env.CLUSTER_TYPE = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_CLUSTER_MANAGER, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_CLUSTER_MANAGER)
        //Ingress Controller
        process.env.INGRESS_CONTROLLER = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_INGRESS_CONTROLLER, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_INGRESS_CONTROLLER)
        //LinSTT Toolkit
        process.env.LINSTT_SYS = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_LINSTT_TOOLKIT, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_LINSTT_TOOLKIT)

        //DOCKER settings
        process.env.DOCKER_SOCKET_PATH = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_DOCKER_SOCKET, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_DOCKER_SOCKET)
        process.env.CHECK_SERVICE_TIMEOUT = ifHas(process.env.CHECK_SERVICE_TIMEOUT, envdefault.CHECK_SERVICE_TIMEOUT)

        //NGINX
        process.env.NGINX_CONF_PATH = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_NGINX_CONF, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_NGINX_CONF)
        process.env.NGINX_SERVICE_ID = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_NGINX_HOST, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_NGINX_HOST)

        //MongoDB
        process.env.MONGODB_HOST = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_HOST, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_HOST)
        process.env.MONGODB_PORT = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_PORT, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_PORT)
        process.env.MONGODB_DBNAME_SMANAGER = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_DBNAME, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_DBNAME)
        process.env.MONGODB_REQUIRE_LOGIN = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_REQUIRE_LOGIN, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_REQUIRE_LOGIN)
        process.env.MONGODB_USER = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_USER, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_USER)
        process.env.MONGODB_PSWD = ifHas(process.env.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_PSWD, envdefault.LINTO_STACK_STT_SERVICE_MANAGER_MONGODB_PSWD)

        //LINSTT
        process.env.LINSTT_IMAGE = ifHas(process.env.LINTO_STACK_LINSTT_IMAGE, envdefault.LINTO_STACK_LINSTT_IMAGE)
        process.env.LINSTT_PORT = ifHas(process.env.LINTO_STACK_LINSTT_PORT, envdefault.LINTO_STACK_LINSTT_PORT)
        process.env.LINSTT_NETWORK = ifHas(process.env.LINTO_STACK_LINSTT_NETWORK, envdefault.LINTO_STACK_LINSTT_NETWORK)

        //SWAGGER
        process.env.SWAGGER_PATH = ifHasNotThrow(process.env.LINTO_STACK_STT_SERVICE_MANAGER_SWAGGER_PATH, 'No LINTO_STACK_STT_SERVICE_MANAGER_SWAGGER_PATH found. Please edit ".env" file')

        // Extrat parameters required when traefik is used
        if (process.env.INGRESS_CONTROLLER == "traefik") {
            process.env.LINTO_STACK_DOMAIN = ifHasNotThrow(process.env.LINTO_STACK_DOMAIN, 'No LINTO_STACK_DOMAIN found. Please edit ".env" file')
            process.env.LINTO_STACK_LINSTT_PREFIX = ifHasNotThrow(process.env.LINTO_STACK_LINSTT_PREFIX, 'No LINTO_STACK_LINSTT_PREFIX found. Please edit ".env" file')
            process.env.LINTO_STACK_LINSTT_PREFIX = process.env.LINTO_STACK_LINSTT_PREFIX.replace(/\//g,"")
        }

        //create the AM folder if it does not exist
        if (!fs.existsSync(process.env.AM_PATH))
            fs.mkdirSync(process.env.AM_PATH)

        //create the LM folder if it does not exist
        if (!fs.existsSync(process.env.LM_PATH))
            fs.mkdirSync(process.env.LM_PATH)

        //create the TMP folder if it does not exist
        if (!fs.existsSync(process.env.TEMP_FILE_PATH))
            fs.mkdirSync(process.env.TEMP_FILE_PATH)

        //process.env.WHITELIST_DOMAINS = ifHasNotThrow(process.env.WHITELIST_DOMAINS, 'No whitelist found. Please edit ".env" file')
        //process.env.COMPONENTS = ifHasNotThrow(process.env.COMPONENTS, Error("No COMPONENTS env_var specified"))
    } catch (e) {
        console.error(debug.namespace, e)
        process.exit(1)
    }
}
module.exports = configureDefaults()
