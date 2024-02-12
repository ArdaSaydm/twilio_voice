import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

import 'package:cloud_functions/cloud_functions.dart';

import 'utils.dart';

class Result {
  final String identity;
  final String accessToken;

  Result(this.identity, this.accessToken);
}

/// Register with a local token generator using URL https://us-central1-twilio-voip-app.cloudfunctions.net/accessToken/token. This is a function to generate token for twilio voice.
/// [generateLocalAccessToken] is the default method for registering
///
/// Returned data should contained the following format:
/// {
///  "identity": "user123",
///  "token": "ey...",
/// }
Future<Result?> generateLocalAccessToken() async {
  printDebug("voip-registering with token ");
  printDebug("POST https://us-central1-twilio-voip-app.cloudfunctions.net/accessToken");

  final uri = Uri.https("us-central1-twilio-voip-app.cloudfunctions.net", "/accessToken");
  
  // Specify the JSON data to be sent in the request body
  final jsonData = {
    "data": {
      "isAndroid": true,
      "production": true
    }
  };

  try {
    final result = await http.post(
      uri,
      body: json.encode(jsonData), // Encode the JSON data to a string
      headers: {"Content-Type": "application/json"}, // Specify the content type as JSON
    );

    if (result.statusCode >= 200 && result.statusCode < 300) {
      final data = jsonDecode(result.body);
      final identity = data["result"]["identity"] as String?;
      final token = data["result"]["token"] as String?;

      if (identity == null || token == null) {
        printDebug("Error: Identity or token is null");
        return null;
      }

      printDebug("Token: $token, Identity: $identity");

      return Result(identity, token);
    } else {
      printDebug("Error: Request failed with status code ${result.statusCode}");
      printDebug(result.body);
    }
  } catch (e) {
    printDebug("Error: Exception occurred during request: $e");
  }

  return null;
}


/// Register with a firebase function token generator using function name 'voice-accessToken', this is a function to generate token for twilio voice.
///
/// Returned data should contained the following format:
/// {
///  "identity": "user123",
///  "token": "ey...",
/// }
///
Future<Result?> generateFirebaseAccessToken() async {
  printDebug("voip-registtering with token ");
  printDebug("voip-calling voice-accessToken");
  final function =
      FirebaseFunctions.instance.httpsCallable("voice-accessToken");

  final params = {
    "platform": Platform.isIOS ? "iOS" : "Android",
  };

  final result = await function.call(params);

  final data = jsonDecode(result.data);
  final identity = data["identity"] as String?;
  final token = data["token"] as String?;

  if (identity == null || token == null) {
    printDebug("Error requesting token from server [${function.toString()}]");
    printDebug(result.data);
    return null;
  }
  return Result(identity, token);
}
