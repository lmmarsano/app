# Journal REST App
## Environment Parameters & Defaults
Web Server

| Parameter | Default | Meaning |
| --- | --- | --- |
| `PORT` | 3000 | Port for incoming connections |

Mongo Database

| Parameter | Default | Meaning |
| --- | --- | --- |
| `dbHost` | localhost | Hostname |
| `dbPort` | 27017 | Port for incoming connections |
| `db` | journal | Database name |
| `dbUser` | | Username |
| `dbPassword` | | Password |

Key Derivation ([Argon2](//en.wikipedia.org/wiki/Argon2))

| Parameter | Default | Meaning |
| --- | --- | --- |
| `kdCycles` | | Time in terms of computation rounds |
| `kdMemory` | | Amount of memory (KiB) to consume |
| `kdCores` | Detected number of CPU cores | Number of cores to commit |

Override the defaults by setting parameters in the environment or `.env`.

## Running the server
Normal
```sh
npm start
```

With debug messages
```sh
DEBUG='koa* app*' npm start
```

## Testing
```sh
npm test
```
