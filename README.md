```bash
/media/mrlung/DOCS/PTIT-4/IOT/IoT_CleanArchitecture ❯ tree                  
.
├── config
│   ├── app-config.json
│   ├── db.js
│   ├── index.js
│   ├── mqtt.js
│   └── websocket.js
├── docker-compose.yml
├── index.js
├── infra
│   └── mqtt
│       ├── config
│       │   └── mosquitto.conf
│       └── init.sh
├── migrations
│   ├── 001_create_sensor_data.sql
│   ├── 002_create_device_control.sql
│   ├── 003_create_sample_data.sql
│   └── 004_create_function.sql
├── package.json
├── package-lock.json
├── public                      #=====> Chi chinh giao dien o day nhe!
│   ├── assets
│   │   ├── icons
│   │   └── images
│   ├── css
│   │   ├── main.css
│   │   └── variables.css
│   ├── index.html
│   ├── js
│   │   ├── api.js
│   │   ├── components
│   │   ├── config.js
│   │   ├── main.js
│   │   ├── pages
│   │   │   └── dashboard.js
│   │   ├── utils
│   │   └── websocket.js
│   └── templates
│       ├── activity-history.html
│       ├── dashboard.html
│       ├── profile.html
│       └── sensor-data.html
├── README.md
└── src
    ├── controllers
    │   ├── deviceController.js
    │   ├── profileController.js
    │   └── sensorController.js
    ├── middlewares
    │   ├── auth.js
    │   ├── cors.js
    │   ├── errorHandler.js
    │   └── validation.js
    ├── models
    │   ├── database.js
    │   ├── deviceModel.js
    │   └── sensorModel.js
    ├── routes
    │   ├── deviceRoutes.js
    │   ├── index.js
    │   ├── profileRoutes.js
    │   └── sensorRoutes.js
    ├── services
    │   ├── deviceService.js
    │   ├── mqttService.js
    │   ├── sensorService.js
    │   └── websocketService.js
    ├── task
    │   ├── httpsHandler.js
    │   └── realtimeHandler.js
    └── utils
        ├── constants.js
        ├── dateHelper.js
        └── validators.js
```"# system_IoT" 
"# system_IoT" 
"# system_IoT" 
"# IoT_Project" 
