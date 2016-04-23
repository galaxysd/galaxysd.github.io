---
layout: post
slug: "Extract-GoogleAuthQR-from-Authy"
title: How to extract your TOTP secrets from Authy
description: 
category: 
tags: Galaxy, Tips, DIY
---

转自[Guillaume Boudreau](https://www.pommepause.com/2014/10/how-to-extract-your-totp-secrets-from-authy/)。他控空格缩进，咱控省流量的 Tab，遂改之。

Maybe you just want to back them up for when something goes wrong, or maybe you want to set up a new two-factor authentication app on a platform that Authy doesn’t support (*cough* Windows Phone *cough*). Whatever your reasons, if you want to export your TOTP secret keys from Authy, their apps or support guys won’t be much help to you.

The trick, that I just used to install all my existing TOTP secrets in the Microsoft Authenticator app, is to change one of their app of which we have the source, namely [their Chrome app](https://chrome.google.com/webstore/detail/authy/gaedmjdfmmahhbjefcbgaolhhanlaolb), to show us what we want.

So I opened `gaedmjdfmmahhbjefcbgaolhhanlaolb/js/app.js` from my Chrome Extensions folder (`~/Library/Application Support/Google/Chrome/Default/Extensions` on a Mac, `~/.config/google-chrome/Default/Extensions` on Linux) in my favorite text editor (TextMate), and used JavaScript > Reformat Selection to be able to see what was happening in there. I then found that the shared secrets I was after was stored in GoogleAuthApp.decryptedSeed. I was looking for the decrypted version, because I didn’t want to have to understand where the encrypted values were stored, and how I could decrypt them myself; their Chrome app could decrypt them already, so all I needed was to add something in there that would somehow output them.

So I added a getter for the shared secret, in GoogleAuthApp, like this:

````JavaScript
}, GoogleAuthApp.prototype.getOtp = function() {
 return this.isEncrypted() ? "------" : this.otpGenerator.getOtp(this.decryptedSeed)
}, GoogleAuthApp.prototype.getSharedSecret = function() {
 return this.isEncrypted() ? "?" : this.decryptedSeed
}, GoogleAuthApp.prototype.isDecrypted = function() {
````

Then I modified TokensView.prototype.updateTokens to output this info, along with the human-readable name of the entry, in a link to a QR code that I can scan in any TOTP client (compatible with Google Authenticator), like this:

````JavaScript
}, TokensView.prototype.updateTokens = function(tokenRows) {
	var app, element, tokenRow, _i, _len, _results;
	for (_results = [], _i = 0, _len = tokenRows.length; _len > _i; _i++) tokenRow = tokenRows[_i], element = $(tokenRow), app = AppManager.get().find(element.attr("data-token-id")), _results.push(element.find(".tokenCode").text(app.getOtp()));
		for (_i = 0, _len = tokenRows.length; _len > _i; _i++) {
		tokenRow = tokenRows[_i];
		element = $(tokenRow);
		app = AppManager.get().find(element.attr("data-token-id"));
		try {
			var $sharedSecretBlock = element.find(".sharedSecret");
			if ($sharedSecretBlock.length == 0) {
			   element.append('<div class="sharedSecret" style="float:right;font-size:13px;padding-right:8px">');
			   $sharedSecretBlock = element.find(".sharedSecret");
			}
			var qrQata = "otpauth://totp/" + encodeURIComponent(app.getName(app)) + "?secret=" + encodeURIComponent(app.getSharedSecret(app));
			$sharedSecretBlock.html('<a href="https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=' + encodeURIComponent(qrQata) + '" target="_blank">Show Secret QR');
			} catch(err) {
		}
	}
	return _results
````

I noticed `TokensView.prototype.updateTokens` is only called after the tokens expire, so at most 30 seconds after you decrypted your data by entering your password, but eh, good enough.

So, if you want to do that too, you can try to do the changes I detailed above, or just replace your `gaedmjdfmmahhbjefcbgaolhhanlaolb/js/app.js` with [my version](assets/images/2016/Authy-Chrome-app-1.3.js) (based on version 1.3 of their Chrome app), and wait between 0 and 30 seconds to see the links appear:

![Authy-Chrome-app-with-QR-codes](assets/images/2016/Authy-Chrome-app-with-QR-codes.png)

Click them one by one, scan them with your new client, and voilà! You’re ready to rock two-factor logins on your new device.

Of note: CloudFlare doesn’t show a QR code in my screenshot above because it uses “Authy two-factor authentication”, which is not compatible with Google Authenticator. There’s just no point in exporting those out of Authy, since they are not usable anywhere else…

````Patch
--- old.js
+++ app.js
@@ -4215,6 +4215,8 @@
 			return this.name
 		}, GoogleAuthApp.prototype.getOtp = function() {
 			return this.isEncrypted() ? "------" : this.otpGenerator.getOtp(this.decryptedSeed)
+		}, GoogleAuthApp.prototype.getSharedSecret = function() {	
+			return this.isEncrypted() ? "?" : this.decryptedSeed
 		}, GoogleAuthApp.prototype.isDecrypted = function() {
 			return null != this.decryptedSeed
 		}, GoogleAuthApp.prototype.isMarkedForDeletion = function() {
@@ -6497,6 +6499,21 @@
 		}, TokensView.prototype.updateTokens = function(tokenRows) {
 			var app, element, tokenRow, _i, _len, _results;
 			for (_results = [], _i = 0, _len = tokenRows.length; _len > _i; _i++) tokenRow = tokenRows[_i], element = $(tokenRow), app = AppManager.get().find(element.attr("data-token-id")), _results.push(element.find(".tokenCode").text(app.getOtp()));
+			for (_i = 0, _len = tokenRows.length; _len > _i; _i++) {
+				tokenRow = tokenRows[_i];
+				element = $(tokenRow);
+				app = AppManager.get().find(element.attr("data-token-id"));
+				try {
+					var $sharedSecretBlock = element.find(".sharedSecret");
+					if ($sharedSecretBlock.length == 0) {
+					   element.append('<div class="sharedSecret" style="float:right;font-size:13px;padding-right:8px">');
+					   $sharedSecretBlock = element.find(".sharedSecret");
+					}
+					var qrQata = "otpauth://totp/" + encodeURIComponent(app.getName(app)) + "?secret=" + encodeURIComponent(app.getSharedSecret(app));
+					$sharedSecretBlock.html('<a href="https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=' + encodeURIComponent(qrQata) + '" target="_blank">Show Secret QR');
+					} catch(err) {
+				}
+			}
 			return _results
 		}, TokensView.prototype.updateAuthyTimer = function(timeRemaining) {
 			return $("[data-token-id^='" + AuthyApp.ID_PREFIX + "'] .labelSecondsRemaining").text("" + timeRemaining)
````
