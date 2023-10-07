const { IgApiClient } = require("instagram-private-api");
const fs = require("fs");

const ig = new IgApiClient();

class instagram {
  constructor(username, password, delay) {
    this.username = username;
    this.password = password;
    this.delay = delay;
  }

  async login() {
    try {
      try {
        let session = fs.readFileSync(
          `./sessions/${this.username}.json`,
          "utf-8"
        );
        session = JSON.parse(session);
        await ig.state.deserialize(session);
        fs.writeFileSync(
          `./sessions/${this.username}.json`,
          JSON.stringify(await ig.state.serialize())
        );
        let user = await ig.account.currentUser();
        await this.delay(5);
      } catch (error) {
        ig.state.generateDevice(this.username);
        const login = await ig.account.login(this.username, this.password);
        fs.writeFileSync(
          `./sessions/${this.username}.json`,
          JSON.stringify(await ig.state.serialize())
        );
        await this.delay(5);
        return Promise.resolve(login);
      }
    } catch (err) {
      return Promise.reject(err.message);
    }
  }

  async mediaInfo(mid) {
    try {
      const info = await ig.media.info(mid);
      return Promise.resolve(info);
    } catch (err) {
      return Promise.reject(err.message);
    }
  }

  async tagFeed(hashtag) {
    try {
      const feed = await ig.feed.tags(hashtag, "recent");
      return Promise.resolve(feed);
    } catch (err) {
      return Promise.reject(err.message);
    }
  }

  async comment(mid, msg) {
    let response = {
      isCommentSuccess: undefined,
      isSpamError: undefined,
      errMsg: undefined,
    };
    try {
      await ig.media.comment({ mediaId: mid, text: msg });
      response.isCommentSuccess = true;
      return response;
    } catch (err) {
      err = err + " ";
      response.isCommentSuccess = false;
      response.errMsg = err;

      if (err.includes("IgActionSpamError")) {
        response.isSpamError = true;
      }

      return response;
    }
  }
}


module.exports = { instagram };
