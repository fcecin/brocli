# brocli
Brocli is a sample NodeJS application built on top of GPPS (https://github.com/fcecin/gpps) that retrieves small brotli-compressed HTML files from an Antelope blockchain's RAM.

This is a simple example that is hard-coded to use 0rigin's UX Network API server and to use the datastoreutx GPPS smart contract. The code can be easily changed to connect to any Antelope blockchain and to use any deployment of the GPPS contract code.

The application was built with the ExpressJS framework.

Deploying this into an actual webhost or cloud service is left as an exercise to the reader. There may be a deployment of Brocli running on https://brocli.nearlyfreespeech.net/.

## How it works

Once the NodeJS application is started, it will open a Node web server on port 57057 and start answering the following route requests:

/ -> serves the index.html file in the root app dir.

/n/accountname/nodeid -> Attempts to retrieve and/or download the GPPS node for scope 'accountname' and node id (number) 'nodeid'. Example: /n/datastoreutx/1

/p/accountname/nodeid -> Attempts to retrieve the GPPS node for for scope 'accountname' and node id (number) 'nodeid'. If the node is already downloaded, attempts to unpack it using brotli; if successful, the uncompressed content of the node will be interpreted as an HTML file. If the HTML file is already produced, this will serve it to the client. Example: /p/datastoreutx/1

/d/accountname/nodeid -> Displays debug information on the given scope, node and page, if any are found.

## Future work

This is a very simple example to showcase the storage of very small HTML files in compressed form using the GPPS contract. In the future, Brocli should actually know how to handle entire websites with multiple files. These would be obtained from a range of nodes, which are the split form of a compressed file that contains an entire website.

