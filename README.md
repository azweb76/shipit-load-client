# shipit-load-client
Load testing client for the shipit-load-api service.

```bash
shipitload --config taurus.yml --url http://ltaas.mydomain.com --agents 5 --hosts ./hosts
```

## Installation

```
$ npm install -g shipit-load-client
```

## Features

* Run load tests using Blazemeter Taurus on a Kubernetes cluster.
* Auto provision jmeter agents.
* Set hosts file on jmeter agents for DNS overrides.
