// Blockchain
const { Api, JsonRpc, RpcError } = require('eosjs');
const { TextEncoder, TextDecoder } = require('util');

// Use one of these; one of them should work
//const fetch = require('node-fetch');
//import fetch from "node-fetch";
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Express
var express = require('express');
var app = express();

// Misc
const fs = require('fs');
const zlib = require('zlib');

// UX Network API connection
const rpc = new JsonRpc('https://api.uxnetwork.io', { fetch }); // 0rigin - UX Network
//const rpc = new JsonRpc('https://api.eosn.io', { fetch }); // EOS Nation - EOS Network

// Debug: catch everything
//process.on('uncaughtException', function (err) {
//  console.error(err);
//});

// Hex string converter
const fromHexString = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

// Webserver routing

app.get('/', function (req, res) {
    res.sendFile("index.html", { root: __dirname }); 
});

app.listen(57057, function () {
    console.log('Brocli running.');
});

app.get('/n/:scope/:node', function (req, res) {
    serve_node(req, res);
});

app.get('/p/:scope/:node', function (req, res) {
    serve_page(req, res);
});

app.get('/d/:scope/:node', function (req, res) {
    serve_debug(req, res);
});

// TODO: routing for multipart content / entire websites.
//       the node is a descriptor of the website: points
//       to other nodes, and maybe has hashes.
//
//app.get('/w/:scope/:node/*', function (req, res) {
//    serve_page(req, res);
//});

// This takes care of retrieving and caching binary nodes from chain RAM. 

function check_node (scope, node) {

    // returns an error string or empty string if no error.
    // error means the request cannot be fulfilled yet, and some
    //   asynchronous function may be trying to fix it.

    // Param conversion and basic validation
    node = Number(node);
    if (!Number.isInteger(node) || node < 0) {
	return "Invalid node id: " + node;
    }
    if (scope.length > 12) {
	return "Invalid account name (too long): " + scope;
    }
    
    // if nodes/scope dir does not exist
    //   ask chain if account for scope exists
    //   if doesn't exist, return error "non-existent account"
    //   if it exists, create scope dir
    scopeDir = 'nodes/' + scope + '/';
    if (! fs.existsSync(scopeDir)) {
	(async () => {
	    try {
		result = await rpc.get_account( scope );
		// If it reaches here, then it exists.
		fs.mkdirSync(scopeDir, { recursive: true });
	    } catch (err) {
		// If it doesn't exist, then we don't care.
		// We can't cache account name nonexistence.
	    }
	})();

	return "Searching for blockchain account '" + scope + "'. If it exists, try again in a minute.";	
    }

    // if node file does not exist inside scope dir
    //   (name is just the node number):
    //
    //   ask chain for that node. if error, return "blockchain API read error"
    //   if node does not exist, return error "non-existent node"
    //   if zero or more bytes set for the node, extract data and
    //     save binary file (name of file is the node number)
    //   if any other error, return that

    nodeFile = 'nodes/' + scope + '/' + node + ".bin";
    if (! fs.existsSync(nodeFile)) {	
	(async () => {
	    try {
		result = await rpc.get_table_rows({
		    json: true,
		    code: 'datastoreutx',
		    scope: scope,
		    table: 'nodes',
		    lower_bound: node,
		    upper_bound: node,
		    limit: 1,
		    reverse: false,
		    show_payer: false,
		});

		if (result.hasOwnProperty("rows")
		    && result.rows.length > 0
		    && result.rows[0].hasOwnProperty("data"))
		{
		    const byteArray = fromHexString( result.rows[0].data );
		    fs.writeFileSync(nodeFile, byteArray,
				     {
					 flag: "wx",
					 mode: 0o644
				     });
		    
		} else {
		    // Nonexistent node. Might exist in the future. Do nothing.
		}

	    } catch (err) {
		// If an error occurs, there's nothing we can do
		//   that can make anything better.
	    }
	})();

	return "Retrieving node " + node + " from scope '" + scope + "'. If it exists, try again in a minute.";	
    }
    
    // File exists. Caller can attempt to read it.
    return null;
}

// This serves raw binary files for individual node data.

function serve_node (req, res) {

    // call check_node (scope, node)
    // if error, print that and we are done
    // if no error, send the binary file

    s = check_node( req.params.scope, req.params.node );
    if (s != null) { 
	res.send(s);
	return;
    }

    // check_node already validated all of this to us 
    nodeFile = 'nodes/' + req.params.scope + '/' + req.params.node + ".bin";
    res.set("Content-Disposition", 'attachment; filename="' + req.params.node + '.bin"');
    res.sendFile(nodeFile, { root: __dirname });
}

// This interprets single nodes as single html files compressed with brotli and
//   does all the caching and serving accordingly.

function serve_page (req, res) {

    // Param conversion and basic validation
    node = Number(req.params.node);
    if (!Number.isInteger(node) || node < 0) {
	res.send( "Invalid node id: " + node );
	return;
    }
    scope = req.params.scope;
    if (scope.length > 12) {
	res.send("Invalid account name (too long): " + scope);
	return;
    }
    
    // if nodes/scope/"node".html file does not exist
    //   call check_node (scope, node)
    //   if error, print that and we are done
    //   attempt to unpack the node as the html file
    //     and state that you're trying to do that and return.
    // serve the html file

    pageFile = 'nodes/' + scope + '/' + node + ".html";
    if (! fs.existsSync(pageFile)) {

	s = check_node( req.params.scope, req.params.node );
	if (s != null) { 
	    res.send(s);
	    return;
	}

	nodeFile = 'nodes/' + scope + '/' + node + ".bin";
	
	const readStream = fs.createReadStream(nodeFile);
	const writeStream = fs.createWriteStream(pageFile);
	const brotli = zlib.createBrotliDecompress();
	const stream = readStream.pipe(brotli).pipe(writeStream);

	res.send("Attempting to decompress node " + node + " of '" + scope + "' using brotli to obtain an HTML file. Try again later.");
	return;
    }

    // We have the file, so send it
    res.sendFile(pageFile, { root: __dirname });
}

// Serve debug information on a node and page.

function serve_debug (req, res) {

    r = "<H2>Brocli node debug</H2>";

    r += "<P>Request scope: " + req.params.scope + "\n";
    r += "<P>Request node: " + req.params.node + "\n";
    
    // Param conversion and basic validation
    node = Number(req.params.node);
    if (!Number.isInteger(node) || node < 0) {
	r += "<P>Invalid node id: " + node + "\n";
	res.send(r);
	return;
    }
    scope = req.params.scope;
    if (scope.length > 12) {
	r += "<P>Invalid account name (too long): " + scope + "\n";
	res.send(r);
	return;
    }

    nodeFile = 'nodes/' + scope + '/' + node + ".bin";
    pageFile = 'nodes/' + scope + '/' + node + '.html';
    scopeDir = 'nodes/' + scope + '/';

    if (! fs.existsSync(scopeDir)) {
	r += "<P>Nonexistent scope directory.\n";
	res.send(r);
	return;
    }

    r += "<P>Node file: " + nodeFile + "\n";
    nodeExists = fs.existsSync(nodeFile);
    r += "<P>Node file exists: " + nodeExists + "\n";
    if (nodeExists) {
	var stats = fs.statSync(nodeFile);
	r += "<P>Node file size: " + stats.size + " bytes\n";
    }
    
    r += "<P>Page file: " + pageFile + "\n";
    pageExists = fs.existsSync(pageFile);
    r += "<P>Page file exists: " + pageExists + "\n";
    if (pageExists) {
	var stats = fs.statSync(pageFile);
	r += "<P>Page file size: " + stats.size + " bytes\n";
    }
    
    res.send(r);
    return;
}
