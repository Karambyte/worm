# GE2015 Worm
This is a sentiment analysis worm built in a few hours on the eve of the 2015 General Election. You can see it in action [here](https://twitter.com/theframeworkguy/status/596622774447304704) and [here](https://twitter.com/theframeworkguy/status/596695295972499456). It uses the public stream of the [Twitter Streaming API](https://dev.twitter.com/streaming/overview) and [Sentiment](https://github.com/thisandagain/sentiment) to check party hashtags and work out if the tweets on that hashtag are happy or sad. It is fairly limited - it doesn't account for people using the hashtag of a party they don't like, for example! We're planning to rewrite this over the summer with better sentiment analysis and a more robust platform, seen as the existing Node app was built under significant time pressure.

## Installing 
1. Sync the repo, and run `npm install`
2. Acquire some Twitter development tokens. Twitter's [dev guide](https://dev.twitter.com/oauth/overview/application-owner-access-tokens) will walk you through the process. This should give you four different keys: a `Consumer Key` and a `Consumer Secret`, found underneath the **Application Settings** heading, and an `Access Token` and an `Access Token Secret`, found under the **Your Access Token** heading.   

  _The **Consumer** pair of keys is for your application, and the **Access Token** pair grants your app access to your account. Please don't share either of these - sharing these keys will give people access to your account do do as they please._
3. Open `index.js` in the root of the repository. Scroll down to the line starting with `var twitterStreamClient`. Replace the values there as follows:  

    ```javascript
    var twitterStreamClient = new Twitter.StreamClient(
	    'YOUR CONSUMER KEY',
	    'YOUR CONSUMER SECRET',
	    'YOUR ACCESS TOKEN',
	    'YOUR ACCESS TOKEN SECRET'
    );
    ```
4. Run `node index` from the command line to start the Node server.
5. The web app is separately contained inside the `web` folder. Using [http-server](https://github.com/indexzero/http-server) or otherwise, host this on the same machine as the Node server and it'll automatically connect and start displaying information.

## Contributing
We would advise holding off the contributions for a few months whilst we work on the Worm v2.0! We'll publish a full contributor's guide (including our code of conduct) when we're ready to accept contributions on the new platform.

## Contact
If you have questions about this project (or even just fancy a chat), either file an Issue or contact [hello@karambyte.com](mailto:hello@karambyte.com). We look forward to hearing from you!
