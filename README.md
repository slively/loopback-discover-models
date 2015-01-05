<h3>I simple CLI tool to discover and write new model.json and model.js files by using loopback's datasource.discoverSchema API</h3>


<h3>Usage</h3>
```
./node_modules/.bin/loopback-discover-schemas -h                                                      
Usage:
  loopback-discover-schemas [OPTIONS] [ARGS]

Options: 
      --serverPath [PATH]Path to server.js (relative to CWD). (Default is /server/server.js)
      --modelConfigPath [PATH]Path to model-config.json (relative to CWD). (Default is /server/model-config.json)
      --modelDir [PATH]  Path to models folder (relative to CWD). (Default is /common/models)
      --dataSource [STRING]Name of the data source from data sources.json (required). (Default is db)
      --allNewModels [BOOLEAN]Discover and create all models not in modelDir. (Default is false)
      --modelName STRING Name of a single model/table/collection to create.
      --owner STRING     Name of owner/schema/database for the models.
      --relations [BOOLEAN]Include relations. (Default is false)
      --allOwners [BOOLEAN]Include All Owners. (Default is false)
      --views [BOOLEAN]  Include views. (Default is false)
      --skip STRING      Comma seperate model names to skip when discovering new models.
  -h, --help             Display help and usage details
  ```
  
<h5>Generate Models for all tables in the database that don't already exist as models.</h5>
```
./node_modules/.bin/loopback-discover-schemas --allNewModels
```

<h5>generate new models, but skip the tables 'migrations' and 'some_other_table'</h5>
```
./node_modules/.bin/loopback-discover-schemas --allNewModels --skip migrations,some_other_table
```

<h5>Generate new models and put them in a different folder</h5>
```
./node_modules/.bin/loopback-discover-schemas --allNewModels --modelDir /server/models
```

<h5>Generate new models for database 'my_database' instead of default for database connector.</h5>
```
./node_modules/.bin/loopback-discover-schemas --allNewModels --owner my_database
```

<h5>Generate Model for a specific table/collectiom (modelName should be the table/collection name).</h5>
```
./node_modules/.bin/loopback-discover-schemas --modelName some_table
```
