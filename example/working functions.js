const { AccessToken } = require('twilio').jwt;
const functions = require('firebase-functions');

const { VoiceGrant } = AccessToken;

/**
 * Creates an access token with VoiceGrant using your Twilio credentials.
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {string} - The Access Token string and expiry date in milliseconds
 */
exports.accessToken = functions.https.onCall((payload, context) => {
    // Check user authenticated
    // if (typeof (context.auth) === 'undefined') {
    //     throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated');
    // }
    // let userId = context.auth.uid;

    let userId = "TX3ClVXDBzecNE5Abq6wsEyXA7D2";

    console.log('creating access token for ', userId);

    //configuration using firebase environment variables
    // const twilioConfig = functions.config().twilio;
    
    const accountSid = "AC312f7cda8703542c1bd18a8e17e9688a";
    const apiKey = "SK103698263ff97a5717ede4d8bffb6abb";
    const apiSecret = "Ik793HmsCLtyMCSowrSXJ8czKvTFxUrK";
    const outgoingApplicationSid = "AP93652956b4455e3a635f2e621f648256";

    // Used specifically for creating Voice tokens, we need to use seperate push credentials for each platform.
    // iOS has different APNs environments, so we need to distinguish between sandbox & production as the one won't work in the other.
    let pushCredSid;
    if (payload.isIOS === true) {
        console.log('creating access token for iOS');
        pushCredSid = payload.production ? "CR75578fd274548c986e046c83b11be832"
            : ("CR75578fd274548c986e046c83b11be832" || "CR75578fd274548c986e046c83b11be832");
    } else if (payload.isAndroid === true) {
        console.log('creating access token for Android');
        pushCredSid = "CR75578fd274548c986e046c83b11be832";
    } else {
        throw new functions.https.HttpsError('unknown_platform', 'No platform specified');
    }

    // generate token valid for 24 hours - minimum is 3min, max is 24 hours, default is 1 hour
    const dateTime = new Date();
    dateTime.setDate(dateTime.getDate()+1);
    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid,
        pushCredentialSid: pushCredSid,
    });

    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    const token = new AccessToken(accountSid, apiKey, apiSecret,{ identity: userId });
    token.addGrant(voiceGrant);

    // use firebase ID for identity
    // token.identity = userId;
    console.log(`Token:${token.toJwt()}`);

    // return json object
    return {
        "token": token.toJwt(),
        "identity": userId,
        "expiry_date": dateTime.getTime()
    };
});