const { pathConfig } = require("./pathConfig.js");
pathConfig();

const fs = require("fs");

const generateOutput = require("./generateOutput");
let output = [];
let config = [];
let isRunning = false;

// Temp and rugh work
const delay = async (sec) => {
  output.settings.isBotSleep = `${sec}s`;
  return new Promise((resolve) => {
    setTimeout(() => {
      output.settings.isBotSleep = `NILL`;
      resolve();
    }, sec * 1000);
  });
};

// AUTO COMMENT BOT ON HASHTAG

const autoBot = async () => {
  output.settings.isPreview = "NO";
  output.settings.isBotRunning = "Active";
  isRunning = true;
  let ig;
  
  // looping throw in each accounts
  for (
    let accountIndex = 0;
    accountIndex < config.accounts.length;
    accountIndex++
  ) {
    const { instagram } = require("./index.js");
    output.accountStatus[accountIndex].status = "In Progress";
    if (isRunning===false) {
      for (
        let idTemp = accountIndex;
        idTemp < config.accounts.length;
        idTemp++
      ) {
        output.accountStatus[idTemp].status = "Stoped";
      }
      return;
    }
    output.accountStatus[
      accountIndex
    ].onStart = `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;

    // Looping throw in max comments
    try {
      ig = new instagram(
        config.accounts[accountIndex].username,
        config.accounts[accountIndex].password,
        delay
      );
      const login = await ig.login();

      let items;
      for (
        let commnetIndex = 0;
        commnetIndex < output.settings.maxCommentLimit;
        commnetIndex++
      ) {
        if (isRunning===false) {
          for (
            let idTemp = accountIndex;
            idTemp < config.accounts.length;
            idTemp++
          ) {
            output.accountStatus[idTemp].status = "Stoped";
          }
          return;
        }
        // get id data from hashtag and refresh it
        if (commnetIndex % config.postRefreshThresholdForTags == 0) {
          output.settings.postPointer = 0;
          // First try
          try {
            output.settings.tagHealth = "Excellent";
            output.settings.currentHashtag =
              config.hashtags[
                Math.floor(Math.random() * config.hashtags.length)
              ];
            const tags = await ig.tagFeed(output.settings.currentHashtag);
            items = await tags.items();
          } catch (error) {
            error = error + " ";
            await delay(5);
            output.errors.tagFetch.push({
              id: config.accounts[accountIndex].username,
              onTime: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
              message: error,
            });
            // Second try
            try {
              output.settings.tagHealth = "Good";
              output.settings.currentHashtag =
                config.hashtags[
                  Math.floor(Math.random() * config.hashtags.length)
                ];
              const tags = await ig.tagFeed(output.settings.currentHashtag);
              items = await tags.items();
            } catch (error) {
              error = error + " ";
              output.settings.tagHealth = "Error";
              await delay(5);
              output.errors.tagFetch.push({
                id: config.accounts[accountIndex].username,
                onTime: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
                message: error,
              });
            }
          }
        }

        let userMedia;
        for (let chance = 0; chance < 30; chance++) {
          try {
            userMedia = await ig.mediaInfo(
              items[output.settings.postPointer].pk
            );
            if (
              userMedia.items[0].commenting_disabled_for_viewer ||
              items[output.settings.postPointer].commenting_disabled_for_viewer
            ) {
              output.settings.postPointer++;
            } else {
              break;
            }
          } catch (error) {
            error = error + " ";
            output.settings.postPointer++;
            output.errors.comment.push({
              id: config.accounts[accountIndex].username,
              onTime: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
              message: error,
            });
          }
        }
        const task = [
          ig.comment(
            items[output.settings.postPointer].pk,
            config.comments[commnetIndex % config.comments.length]
          ),
        ];
        let [comment] = await Promise.all(task);
        comment.isCommentSuccess
          ? output.accountStatus[accountIndex].success++
          : output.accountStatus[accountIndex].failed++;
        if (comment.errMsg) {
          output.errors.comment.push({
            id: config.accounts[accountIndex].username,
            onTime: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
            message: comment.errMsg,
          });
        }
        output.commentStatus.push({
          targetId: items[output.settings.postPointer].user.username,
          status: comment.isCommentSuccess,
          textComment: config.comments[commnetIndex % config.comments.length],
          onTime: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
        });
        output.settings.postPointer++;
        await delay(config.commentSleepDurationInSeconds);
        if (
          output.accountStatus[accountIndex].failed >=
            config.maxFailedAttempts ||
          comment.isSpamError
        ) {
          break;
        }
      }
    } catch (error) {
      error = error + " ";
      output.accountStatus[accountIndex].status = "Error";
      output.errors.accounts.push({
        id: config.accounts[accountIndex].username,
        onTime: `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
        message: error,
      });
    }
    if (output.accountStatus[accountIndex].status == "In Progress") {
      output.accountStatus[accountIndex].status = "Done";
    }
    output.accountStatus[
      accountIndex
    ].onEnd = `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
    if (accountIndex >= 2) {
      if (
        output.accountStatus[accountIndex].status != "Done" &&
        output.accountStatus[accountIndex - 1].status != "Done" &&
        output.accountStatus[accountIndex - 2].status != "Done"
      ) {
        for (
          let idTemp = accountIndex + 1;
          idTemp < config.accounts.length;
          idTemp++
        ) {
          output.accountStatus[idTemp].status = "Skipped";
        }
        break;
      }
    }
    await delay(30);
  }

  output.settings.isBotRunning = "InActive";
  output.settings.isPreview = "YES";
  
  fs.writeFileSync("./output/output.json", JSON.stringify(output));
  isRunning = false;
};

















// SERVER
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path"); 
const os = require('os');

const app = express();
const port = 7070; // Use port 7070

app.use(cors());
app.use(bodyParser.json());

// Endpoint for fetching data
app.get("/api/data", (req, res) => {
  if (output.length !== 0) {
    res.json(output);
  } else {
    const filePath = "./output/output.json";
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        // File doesn't exist or couldn't be read
        res.json([]);
      } else {
        // Parse JSON data from the file
        try {
          const fileContent = JSON.parse(data);
          res.json(fileContent);
        } catch (parseErr) {
          // Error parsing JSON, return an empty array
          res.json([]);
        }
      }
    });
  }
});


let configBackup=[];
// Endpoint for receiving and handling posted data
app.post("/postData", (req, res) => {
  output = generateOutput(req.body);
  config = req.body;
  // Add your data handling logic here, if needed
  configBackup=req.body;

  res.status(200).json({ message: "Data received successfully" });
});



app.post('/api/control', async (req, res) => {
  const { action } = req.body;

  if (action === 'start') {
    if (config.length!==0) {
      config = configBackup;
      output = generateOutput(configBackup);

      isRunning=true;
      autoBot();
    }
    
  } else if (action === 'stop') {
    isRunning=false;
  } else {
    res.status(400).json({ message: 'Invalid action' });
    return;
  }

  res.json({ message: `${action} request received` });
});


app.get('/api/getStatus', (req, res) => {
  
  res.json({ 
    isRunning:isRunning, 
    isPreview:output.length!=0?(output.settings.isPreview === "YES"?true:false):true,
  });
});




// -----------------------

// Serve the React website from the "./build/" folder
app.use(express.static(path.join(__dirname, "build")));
// Handle all other requests by serving the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
// -------------------------

app.listen(port, () => {
  const localhostUrl = `http://localhost:${port}`;
  const networkInterfaces = os.networkInterfaces();
  let hotspotGatewayUrl = '';

  // Find the hotspot gateway IP address (assumes it starts with '192.168.')
  for (const key in networkInterfaces) {
    const interfaceInfo = networkInterfaces[key];
    for (const info of interfaceInfo) {
      if (info.family === 'IPv4' && info.address.startsWith('192.168.')) {
        hotspotGatewayUrl = `http://${info.address}:${port}`;
        break;
      }
    }
    if (hotspotGatewayUrl) {
      break;
    }
  }

  const tableData = [
    { Location: 'localhost', URL: localhostUrl },
    { Location: 'Hotspot Gateway', URL: hotspotGatewayUrl },
  ];

  console.table(tableData);
  console.log(`Server is running at:\n- ${localhostUrl}\n- ${hotspotGatewayUrl}`);
});
