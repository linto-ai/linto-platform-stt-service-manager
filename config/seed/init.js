//this is an example of the langageModel collection information
/*
db.langModels.insert({
    "name":"firstInsert",
    "entities":[],
    "intents":[],
    "lang":"fr",
    "model":0 // model generated or not
    "date":"01/09/2019"
})

//this an example of the acousticModel collection information
/*
db.acousModels.insert({
    "name":"linstt.v1",
    "lang":"fr",
    "date":"21/01/2019",
    "desc":""
})
*/


db.ymlConfig.insert({
    version: '3.5',
    services: {
        'stt-worker_standelone' : {
        image: 'lintoai/linto-platform-stt-standalone-worker',
        volumes: [{
            in: 'AMPATH',
            out: '/opt/models/AM'
        }, {
            in: 'LMPATH',
            out: '/opt/models/LM'
        }],
        environment: 'SERVICE_PORT=2000',
        deploy: {
            mode: 'replicated',
            endpoint_mode: 'dnsrr',
            replicas: 1
        },
        networks: ['linto-net']
    }},
    networks: {
        'linto-net' : {
            external : true
        }
    }
})