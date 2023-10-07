 function generateOutput(formData) {
    let output = {
      settings: {
        currentHashtag: "-",
        maxCommentLimit: formData.maxCommentLimit,
        maxFailedAttempts: formData.maxFailedAttempts,
        commentSleepDuration: formData.commentSleepDurationInSeconds+"s",
        isBotSleep:'NILL',
        postRefreshThresholdForTags: formData.postRefreshThresholdForTags,
        postPointer: 0,
        tagHealth: "-",
        isPreview:"NO",
        isBotRunning:"Tap 'Start' to begin."
      },
      accountStatus: [],
      commentStatus: [],
      errors:{
        accounts:[],
        tagFetch:[],
        comment:[]
      }
    };
  
    for (let i = 0; i < formData.accounts.length; i++) {
      output.accountStatus.push({
        account: formData.accounts[i].username,
        status: "-",
        onStart: "-",
        onEnd: "-",
        success: 0,
        failed: 0,
      });
    }
  
    return output;
  }
  
  module.exports = generateOutput;