const express = require("express");
const zlib = require("zlib");
const { createProxyMiddleware } = require("http-proxy-middleware");
let app = express();

app.use(
  "/",
  createProxyMiddleware({
    target: "https://www.change.org/",
    changeOrigin: true,
    ws: true,
    logLevel: "error",
    cookieDomainRewrite: {
      "*": "",
    },
    onProxyRes: (proxyRes, req, res) => {
      let originalBody = Buffer.from([]);

      // Intercept the Result Body, the original body is zlib compressed
      proxyRes.on("data", (data) => {
        originalBody = Buffer.concat([originalBody, data]);
      });

      /* 
        Once body is completely saved, "End" event is triggered
        Replace assets links on body to use "assetsfechngit.herokuapp.com" instead
      */
      proxyRes.on("end", () => {
        // Uncompress the body
        const bodyString = zlib.gunzipSync(originalBody).toString("utf8");
        var newBody = "";

        // Change links
        try {
          newBody = bodyString.replace(
            /assets-fe.change.org/gm,
            "assetsfechngit.herokuapp.com"
          );
        } catch (e) {
          console.log(e);
        }

        // Prepare the headers
        // Note: maybe adding some headers will fix the "Session expired" on the form
        res.set({
          "content-type": "text/html; charset=utf-8",
          "content-encoding": "gzip",
        });

        // Compress the body again
        res.write(zlib.gzipSync(newBody));
        res.end();
      });
    },
    selfHandleResponse: true,
  })
);

// Run server
var listener = app.listen(process.env.PORT || 8080, () =>
  console.log("server started on port: " + listener.address().port)
);
