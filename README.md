**NOTE: This is deprecated. Use [PermaServe](https://github.com/fcecin/pserve) instead.**

# brocli
Brocli is a sample NodeJS application built on top of GPPS (https://github.com/fcecin/gpps) that retrieves small brotli-compressed HTML files from an Antelope blockchain's RAM.

This is a simple example that is hard-coded to use 0rigin's UX Network API server and to use the datastoreutx GPPS smart contract. The code can be easily changed to connect to any Antelope blockchain and to use any deployment of the GPPS contract code.

The application was built with the ExpressJS framework.

Deploying this into an actual webhost or cloud service is left as an exercise to the reader. There may be a deployment of Brocli running on https://brocli.nfshost.com/.

## Getting the dependencies

The command below, run on your project directory (where you download this), should generate a `node_modules` subdirectory that would contain the ExpressJS and EOSJS dependencies (Javascript is not my forté, so your mileage may vary):

```
npm install
```

## Running

```
node app.js
```

Here's a guide on how to deploy it on https://nearlyfreespeech.net: https://gist.github.com/aconanlai/42492364aa036a02d10aec0a22415ec6

## How it works

Once the NodeJS application is started, it will open a Node web server on port 57057 and start answering the following route requests:

`/` -> serves the `index.html` file in the root app dir.

`/n/accountname/nodeid` -> Attempts to retrieve (to the web server cache) and/or download (to the browser client) the GPPS node for scope `accountname` and node id (number) `nodeid`. Example: `/n/datastoreutx/1`

`/p/accountname/nodeid` -> Attempts to retrieve (to the web server cache) the GPPS node for for scope `accountname` and node id (number) `nodeid`. If the node is already retrieved, attempts to unpack it (in the web server cache) using brotli; if successful, the uncompressed content of the node will be interpreted as an HTML file. If the HTML file is already produced, this will serve it to the browser client. Example: `/p/datastoreutx/1`

`/d/accountname/nodeid` -> Displays debug information on the given scope, node and page, if any are found.

## Data storage

All data retrieved by Brocli from the blockchain will be stored in a subdirectory called `nodes` that will be created by the application if and when it is needed (usually when the first node is accessed and downloaded). That subdirectory also stores any HTML pages successfully brotli-uncompressed from node data. Under `nodes`, a further subdirectory is created for each user scope that is known and requested, and each such subdirectory will contain files in the format `nodeid.bin` and `nodeid.html`, where `nodeid` is the ID number of the respective GPPS data node.

Currently, Brocli does not know how to check for updated nodes. All retrieved nodes are assumed to be immutable.

## Concurrency and error handling

Concurrency controls and error handling in Brocli are very poor in general. It may e.g. bungle data nodes or page data, or fail in a number of other ways.

This is a demo. Contributions welcome.

## Future work

This is a very simple example to showcase the storage of very small HTML files in compressed form using the GPPS contract. In the future, Brocli should actually know how to handle entire websites with multiple files. These would be obtained from a range of nodes, which are the split form of a compressed file that contains an entire website.

