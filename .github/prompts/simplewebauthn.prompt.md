---
title: Browser Quirks
---

## Safari

When adding support for WebAuthn, special considerations must be made for the Safari browser on both iOS and macOS:

* [@simplewebauthn/browser's `startRegistration()`](packages/browser.mdx#startregistration) and [`startAuthentication()`](packages/browser.mdx#startauthentication) must be called in a **native** click listener (user gesture detection). Some JS UI libraries may not use native click handling without the use of framework-specific functionality.
* Safari only supports the use of XHR and `fetch` within native click handlers for requesting WebAuthn registration and authentication options. `fetch` and XHR wrappers like [ofetch](https://github.com/unjs/ofetch) or [axios](https://github.com/axios/axios) might cause problems with user gesture detection. To avoid problems with user gesture detection, it's best to have a single native `fetch` or XHR call and not use any other async operations (promises, timeouts, ...) before calling `startRegistration()` / `startAuthentication()`.
* Websites viewed in Safari running **in iOS 17.4 and macOS 14.4 and later** are free to invoke WebAuthn as needed. There is [an internal rate limiter within Safari](https://forums.developer.apple.com/forums/thread/747036) to prevent abuse of WebAuthn, but "well-behaving" Relying Parties should no longer have user gesture requirements to contend with anymore (see below.)
  * Versions of Safari running **in iOS 17.3 and macOS 14.3 and earlier**...
    * ...may experience issues with session replay tools such as Sentry Session Replay or LogRocket causing problems with user gesture detection.
    * ...allow websites to make **one** call to `navigator.credentials.create()` or `navigator.credentials.get()` (via [`startRegistration()`](packages/browser.mdx#startregistration) or [`startAuthentication()`](packages/browser.mdx#startauthentication) respectively) for every browser navigation event without requiring a user gesture, e.g. to support Conditional UI. When using a Single-Page Application (SPA) this limit only gets reset after reloading the page.

## Microsoft Edge

The Microsoft Edge browser refers to two different browsers: the original release from 2015 (now called ["Microsoft Edge Legacy"](https://support.microsoft.com/en-us/microsoft-edge/what-is-microsoft-edge-legacy-3e779e55-4c55-08e6-ecc8-2333768c0fb0)), and the Chromium-based version from June 2020 that inherited the name "Microsoft Edge".

When adding support for WebAuthn, special considerations must be made for **Microsoft Edge Legacy**:

* [The browser global `TextEncoder` is not supported.](https://caniuse.com/textencoder) This means **@simplewebauthn/browser** will not work in this browser without a polyfill for this API. [MDN includes a spec-compliant polyfill](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder#Polyfill) that can be copied into your project. Various browser [polyfill libraries exist on NPM](https://www.npmjs.com/search?q=textencoder%20polyfill%20browser) as well.

## Firefox

WebAuthn responses from security keys that generate keypairs using Ed25519 (i.e. `-8`) can fail response verification during registration due to a bug in the browser itself. This can manifest as the following error message from **@simplewebauthn/server** methods:

```
Error: Leftover bytes detected while parsing authenticator data
```

These responses may also fail to be verified by `verifyRegistrationResponse()`, **even when the same server setup and security key are used in a different browser**:

```ts
const verifiedFirefox = await verifyRegistrationResponse({ ... });

console.log(verifiedFirefox.verified); // false
```

The issue was caused by a bug in authenticator-rs ([mozilla/authenticator-rs#292](https://github.com/mozilla/authenticator-rs/pull/292)), and according to Mozilla ([Bugzilla Bug 1852812](https://bugzilla.mozilla.org/show_bug.cgi?id=1852812)) **should be resolved as of Firefox 119**.
---
title: Example Project
---

## Introduction

What follows is a more in-depth look at the [example project](https://github.com/MasterKale/SimpleWebAuthn/tree/master/example) available in the repo. A single-file Express server and a few HTML files have been combined with the packages in this project to demonstrate what it takes to get up and running with WebAuthn. This is intended to be a practical reference for implementing the SimpleWebAuthn libraries to add WebAuthn-based Two-Factor Authentication (2FA) support to your website.

Before going any further, though, it's worth noting that the WebAuthn browser API by itself isn't very useful. Developers that want to leverage this API and these libraries are required to have a server with a few things already up and running:

- A **stateful** server capable of temporarily persisting values
- A database that can store information linked to individual users

:::tip

Don't fret if you don't already have a setup like this! The example project mocks out enough of this functionality to offer you a simple WebAuthn sandbox to play around with before you dive in further.

:::

## Getting started

The example server is a Node server, so you'll need the following available on your machine:

- Node.js
  - [Install the current LTS release](https://nodejs.org/en/download/) if you're new to all of this
  - The `npm` (Node Package Manager) executable comes with an installation of Node

### Downloading the code

First and foremost, get the SimpleWebAuthn code downloaded to your machine. You can [click here to download](https://github.com/MasterKale/SimpleWebAuthn/archive/master.zip) a ZIP file containing a current snapshot of the codebase, or clone it with `git`:

```bash
$> git clone https://github.com/MasterKale/SimpleWebAuthn.git
```

After unzipping or cloning the codebase, `cd` to it in a terminal before continuing:

```bash
$> cd SimpleWebAuthn
./SimpleWebAuthn/ $>
```

### Installing dependencies

First, navigate to the example project directory:

```bash
./SimpleWebAuthn/ $> cd example
./example/ $>
```

Next, install dependencies with `npm`:

```bash
./example/ $> npm install
```

### Starting the server

Once the two files above are in-place, you can start the server:

```bash
./example/ $> npm start
```

The example server should now be available at [http://localhost:8000](http://localhost:8000)!

## Setting up HTTPS support

:::info
Setting up HTTPS support will enable you to access the example project from other devices on your intranet, including smartphones, so that you can test WebAuthn across multiple environments from the safety of your own network, no internet access needed!
:::

:::caution
The following steps assume you own a custom domain and have full access to its DNS configuration. You must be able to create DNS A and CNAME records for your domain/subdomain to complete the steps below.

For the steps below, replace **dev.example.com** with your own domain/subdomain. To clarify, **this setup will *not* expose this server to the internet.**
:::

:::tip
Below are a suggested list of steps to host the example project over HTTPS from a development machine. They are not the only way to accomplish this task, so feel free to deviate as you see fit. The end goal is what's important here, not necessarily how you get there.
:::

WebAuthn must be run from a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), that is from either `http://localhost` or from an `https://` address using a valid SSL certificate. While the example project works fine over localhost right out of the box, additional work is needed to get it running over HTTPS:

1. Determine your intranet IP address. This will likely be an address in the **192.168.1.\*** range
2. Create an A record for **dev.example.com** in your domain's DNS configuration pointing to the IP address above.
3. Install EFF's [certbot](https://certbot.eff.org/instructions) according to your local OS
   1. Select **"None of the Above"** and then **your OS** to see instructions
   2. Stop once you complete the **"Install Certbot"** step
4. Run the following `certbot` command and follow its instructions to generate SSL certificates for **dev.example.com**:

```bash
$> sudo certbot --manual -d dev.example.com --preferred-challenges dns certonly
```

:::info
These SSL certificates are only good for 90 days. To renew your local SSL certificates after 90 days, simply re-run the command above.
:::

5. Copy the resulting **/etc/letsencrypt/live/dev.example.com/fullchain.pem** to **./example/dev.example.com.crt**
6. Copy the resulting **/etc/letsencrypt/live/dev.example.com/privkey.pem** to **./example/dev.example.com.key**
7. Create a **.env** file and add the following environment variable:

```env title="example/.env"
ENABLE_HTTPS=true
```

8. Open **index.ts** and update `rpID`:

```js title="example/index.ts"
const rpID = 'dev.example.com';
```

9. Once everything is in place, start the server:

```sh
./example $> npm start
```

Assuming everything is in place, the server will then be accessible at https://dev.example.com.

Additionally, since the **dev.example.com** DNS A record points to your local machine's intranet IP address, any device connected to your intranet will be able to access the example project at https://dev.example.com to test the device's support for WebAuthn.
---
title: Passkeys
---

## Introduction

Passkeys represent a compelling WebAuthn-based alternative to the timeless combination of "password + second-factor" that we all suffer through.

Passkeys are phishing-resistant, are unique across every website, and can help users maintain account access after device loss.

Additionally, passkeys generated by the three main platform authenticator vendors (Apple, Google, and Microsoft) are automatically synchronized across a user's devices by their respective cloud account. That means there's finally an easy way for users to regain account access if they happen to lose or trade in their device. There's never been a better time to update your authentication to use WebAuthn.

The following options are ones you should set when calling SimpleWebAuthn's methods to ensure that your site is ready for passkeys.

## Prerequisites

Below are the three platform authenticator vendors and known minimum versions of their software needed for full passkey support:

**Apple:** iOS 16, macOS 13 (Ventura, Safari-only)

**Google:** Android 9+

**Microsoft:** TBD

FIDO2 security keys are unaffected. They will continue to produce credentials that are hardware bound, and most already support discoverable credentials.

Note that "passkey support" is still "WebAuthn support". Passkeys do not represent a breaking change in how WebAuthn is invoked. Rather they are WebAuthn credentials that can have their private key material synchronized across devices outside the influence of the WebAuthn API. The options below are optimizations for those Relying Parties that want to aim for passkey support as they become more common.

## Server

The high-level strategy here is to instruct the **authenticator** to do the following during registration and authentication:

1. **Generate a discoverable credential**. The authenticator must generate and internally store a credential mapped to (`rpID` + `userID`).
2. **Perform user verification**. The authenticator must provide two authentication factors within a single authenticator interaction.

### `generateRegistrationOptions()`

```ts
import { generateRegistrationOptions } from '@simplewebauthn/server';

const options = await generateRegistrationOptions({
  // ...
  authenticatorSelection: {
    // "Discoverable credentials" used to be called "resident keys". The
    // old name persists in the options passed to `navigator.credentials.create()`.
    residentKey: 'required',
    userVerification: 'preferred',
  },
});
```

User verification is `"preferred"` here because it smooths out potential frictions if a user attempts to use passkeys on a device without a biometric sensor. See ["A note about user verification" on passkeys.dev](https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification) for more context. The actual enforcement of user verification being required for proper passwordless support happens below during response verification.

### `verifyRegistrationResponse()`

```ts
const verification = await verifyRegistrationResponse({
  // ...
  requireUserVerification: false,
});
```

:::caution A word of caution about user verification
`requireUserVerification` is set to `false` above because many websites can be just fine using passkeys without user verification! The phishing resistant properties of WebAuthn elevates passkeys to a higher level of protection than username+password+2fa, and thus passkeys are not necessarily beholden to the same "multiple factors of auth" rules that came before them.

However *some websites*, for various regulatory reasons, may require multiple factors of authentication to be provided. If you are a developer of such a website then you should set `userVerification: 'required'` when calling `generateRegistrationOptions()`, and specify `requireUserVerification: true` when calling `verifyRegistrationResponse()`.
:::

Make sure to save the `transports` value returned from **@simplewebauthn/browser**'s `startRegistration()` method too. Advanced WebAuthn functionality like cross-device auth (i.e. authenticating into a website displayed in Chrome on Windows by using your iPhone) is hard to design good UX around. You can use the browser to figure out when it is available by including each credential's `transports` in the `allowCredentials` array passed later into `generateAuthenticateOptions()`. They will help the browser figure out when a credential might enable a user to log in using new technology that wasn't available before.

Signs that a passkey were created include the following values returned from this method:

- `verification.registrationInfo.credentialDeviceType`: `'multiDevice'` means the credential will be backed up for use on multiple devices within the same platform vendor cloud ecosystem (e.g. only for use on Apple devices sharing an iCloud account)
- `verification.registrationInfo.credentialBackedUp`: `true` means the private key material has been backed up to the user's cloud account. For all intents and purposes this will always be `true` when `credentialDeviceType` above is `'multiDevice'`

**These values can be stored in the database for a given credential** for later reference, to help with understanding rate of adoption of passkeys by your users and adjust your UX accordingly.

### `generateAuthenticationOptions()`

```ts
const options = await generateAuthenticationOptions({
  // ...
  userVerification: 'preferred',
  allowCredentials: [],
});
```

`userVerification` is `"preferred"` here because it smooths out potential frictions if a user attempts to use passkeys on a device without a biometric sensor. See ["A note about user verification" on passkeys.dev](https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification) for more context. The actual enforcement of user verification being required for proper passwordless support happens below during response verification.

`allowCredentials` can also be set to `[]` to allow the user to choose from any discoverable credentials they have for the site when calling `startAuthentication()` after the user clicks a "Sign in with a passkey" button. This "flips the script" on the authentication ceremony by allowing the user to generate a WebAuthn response with a registered passkey, which then tells the RP which account the user wants to log into **without the user needing to provide an account identifier beforehand!** After verifying the response and confirming it recognizes the credential then the RP should create a session for the internal user record that is associated with the response's [`id`](https://w3c.github.io/webappsec-credential-management/#dom-credential-id) (and/or [`userHandle`](https://www.w3.org/TR/webauthn-2/#dom-authenticatorassertionresponse-userhandle) when available.)

:::info
Setting `allowCredentials: []` when calling `generateAuthenticationOptions()` is **OPTIONAL** if you are using **@simplewebauthn/browser**'s `startAuthentication()` method with its second positional `useBrowserAutofill` argument set to `true`; `startAuthentication()` will take care of this for you in this configuration.

See the [Conditional UI section of the docs for `startAuthentication()`](packages/browser.mdx#browser-autofill-conditional-ui) for more information.
:::

### `verifyAuthenticationResponse()`

```ts
const authVerify = await verifyAuthenticationResponse({
  // ...
  requireUserVerification: false,
});
```

:::caution A word of caution about user verification
`requireUserVerification` is set to `false` above because many websites can be just fine using passkeys without user verification! The phishing resistant properties of WebAuthn elevates passkeys to a higher level of protection than username+password+2fa, and thus passkeys are not necessarily beholden to the same "multiple factors of auth" rules that came before them.

However *some websites*, for various regulatory reasons, may require multiple factors of authentication to be provided. If you are a developer of such a website then you should set `userVerification: 'required'` when calling `generateAuthenticationOptions()`, and specify `requireUserVerification: true` when calling `verifyAuthenticationResponse()`.
:::

### Remembering challenges

The `generateRegistrationOptions()` and `generateAuthenticationOptions()` methods both return a `challenge` value that will get signed by an authenticator and returned in the authenticator's response. The goal is for these `challenge` values to get passed back into the `verifyRegistrationResponse()` and `verifyAuthenticationResponse()` methods respectively as their `expectedChallenge` arguments.

The question then becomes, "how do I keep track of these challenges between creating the options and verifying the response when the user isn't yet logged in?" This is particularly tricky with passkeys and conditional UI. During this "usernameless" authentication the user is encouraged to present *any* WebAuthn credential they possess for the site, instead of being told the the discrete list of credentials that they're able to use. If the user can't be known ahead of time, then how can the RP tell the user which credentials they can use for authentication?

:::caution
The following advice is **high-level** and avoids referencing specific frameworks and libraries (beyond SimpleWebAuthn) because every project is different. Please read the suggested course of action below, and then consider how it might be adapted to your project's architecture.
:::

#### Authentication

One technique for tracking the challenge between options generation and response verification is to start a "session" for any user who views your login page.

First, assign a random `sessionID` HTTP-only cookie when the page first loads. When the user attempts to authenticate, call **server**'s `generateAuthenticationOptions()` like normal and temporarily store the challenge somewhere (I like to use [Redis' setex()](https://redis.io/commands/setex/) and store challenges for five minutes [300000 ms]) with the `sessionID` as the key and `options.challenge` as the value. Return the options to the page and await a response.

When the response comes in, look up the `challenge` by the `sessionID` cookie and attempt verification, with `challenge` passed in as `expectedChallenge` to `verifyAuthenticationResponse()`. **Make sure to delete the challenge so it can't be reused, even if verification fails, to prevent replay attacks!** If the authentication response succeeds then log the user in.

#### Registration

New user registration is a bit unique in that it requires "bootstrapping" the creation of the user's session, ideally after verifying that the new user is not a bot. RP's are thus recommended to seek verification of ownership of a unique "point of contact" that the new user has signed up for outside of your service (the point of contact can also help with account recovery in case of device loss.)

A ["magic link"](https://postmarkapp.com/blog/magic-links) sent to an email address, then, is a particularly simple solution that can perform double duty:

:::info Magic Link Example
https://example.com/register?token=mHaikFuCzlQSfmVlIhSH6TY2IRwRYMcj
:::

1. Receiving the magic link confirms that the user is signing up with a valid email account that they have access to, and to which you can send correspondence for account management
2. Clicking the magic link sends back the random, one-time "authorization code" that initiates a registration ceremony

Once the user clicks the link, you can reasonably assume that the user is not a bot and can therefore register an authenticator to their new account.

Challenge management during registration then looks very similar to the steps outlined above in the **Authentication** section, with one slight change: the "session" would be established just before calling `generateRegistrationOptions()`, **after verifying that the authorization code in the URL is valid and hasn't been used before**.

## Browser

There isn't a whole lot that changes in how you call the browser methods if you want to support passkeys, as passkeys don't involve any changes in how WebAuthn is ultimately invoked.

### `startRegistration()`

No changes are required.

...Unless you are interested in leveraging automatic passkey registration, a.k.a. "Conditional Create". Conditional Create will attempt to register a passkey with a user's password manager after a successful password authentication, assuming the password manager is also a passkey provider. This will allow the user to use a passkey instead for subsequent authentications.

See the [Auto Register section of the docs for `startRegistration()`](packages/browser.mdx#auto-register-conditional-create) for more information.

### `startAuthentication()`

No changes are required.

...Unless you are interested in leveraging browser autofill for passkey authentication, a.k.a. "Conditional UI". Conditional UI gives the browser a chance to find and suggest to the user credentials that they can select to then present to you for authentication, all via the browser's native autofill API.

If this interests you, then please see the [Browser Autofill section of the docs for `startAuthentication()`](packages/browser.mdx#browser-autofill-conditional-ui) as there is a bit of setup required to get it all working.
---
title: Custom Challenges
---

:::caution
**The following functionality is opt-in and is not required for typical use!** SimpleWebAuthn remains focused on simplifying working with the WebAuthn API, and the functionality covered in [Packages &gt; @simplewebauthn/server](packages/server.md) will serve the majority of developers' use cases.
:::

## Introduction

Some Relying Parties have highly specialized requirements that require greater control over how options challenges are generated, and how challenges in authenticator responses are verified. SimpleWebAuthn supports some of these use cases with the following capabilities:

## Use a custom string for `challenge`

It is possible to specify custom strings for the `challenge` option when calling `generateRegistrationOptions()` and `generateAuthenticationOptions()`. These strings will be treated as **UTF-8 bytes** when preparing them for use as challenges:

```js
import { generateRegistrationOptions } from '@simplewebauthn/server';

const options = await generateRegistrationOptions({
  // ...
  challenge: 'simplewebauthn',
});
```

Authenticators will **sign over the base64url-encoded challenge** [as per the WebAuthn spec](https://www.w3.org/TR/webauthn-2/#dom-collectedclientdata-challenge). This **must be accounted for** when specifying the same custom string as the `expectedChallenge` option when calling `verifyRegistrationResponse()` and `verifyAuthenticationResponse()`:

```js
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

const verification = await verifyRegistrationResponse({
  // ...
  expectedChallenge: isoBase64URL.fromString('simplewebauthn'),
});
```

## Customize challenge verification logic with `expectedChallenge`

(Pulling from https://github.com/MasterKale/SimpleWebAuthn/pull/172)

A small amount of arbitrary information can be signed over during registration and authentication by overloading the `challenge` value with a stringified complex value. Call `generateRegistrationOptions()` or `generateAuthenticationOptions()` like usual, then override the `challenge` value to add in additional data in a way that is suitable for the use case:

```js
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

const options = await generateAuthenticationOptions({ ... });

// Remember the plain challenge
inMemoryUserDeviceDB[loggedInUserId].currentChallenge = options.challenge;

// Add a simple amount of data to be signed using whatever
// data structure is most appropriate
options.challenge = isoBase64URL.fromString(JSON.stringify({
  actualChallenge: options.challenge,
  arbitraryData: 'arbitraryDataForSigning',
}));
```

After the WebAuthn ceremony is completed, call `verifyRegistrationResponse()` or `verifyAuthenticationResponse()` and pass in a function for `expectedChallenge` that accepts a `challenge` string and returns a `boolean`. This will need to perform the reverse of the logic used above to ensure that "`actualChallenge`" is the expected challenge:

```js
const expectedChallenge = inMemoryUserDeviceDB[loggedInUserId].currentChallenge;

const verification = await verifyAuthenticationResponse({
  // ...
  expectedChallenge: (challenge: string) => {
    const parsedChallenge = JSON.parse(base64url.decode(challenge));
    return parsedChallenge.actualChallenge === expectedChallenge;
  },
});
```

:::info
`expectedChallenge` **can also be an asynchronous function** to support e.g. making a network request to retrieve data needed to complete challenge verification.
:::

Once the response is **successfully** verified then use the `decodeClientDataJSON()` helper to retrieve the arbitrary data:

```js
import { decodeClientDataJSON } from '@simplewebauthn/server/helpers';

const { challenge } = decodeClientDataJSON(body.response.clientDataJSON);
const parsedChallenge = JSON.parse(base64url.decode(challenge));
console.log(parsedChallenge.arbitraryData); // 'arbitraryDataForSigning'
```
---
title: Custom User IDs
---

:::caution
**The following functionality is opt-in and is not required for typical use!** SimpleWebAuthn remains focused on simplifying working with the WebAuthn API, and the functionality covered in [Packages &gt; @simplewebauthn/server](packages/server.md) will serve the majority of developers' use cases.
:::

## Introduction

Some Relying Parties may wish to use their own format of user IDs instead of allowing `generateRegistrationOptions()` to generate a **unique, random, WebAuthn-specific identifier** to [maximize user privacy](https://w3c.github.io/webauthn/#sctn-user-handle-privacy).

In SimpleWebAuthn v9 it was possible to use such string values directly by simply assigning them to `userID` when calling `generateRegistrationOptions()`. **As of SimpleWebAuthn v10**, though, RP's now must account for the library-orchestrated use of base64url string encoding to get `user.id` bytes to the browser during registration, and `userHandle` bytes to the server during authentication.

:::caution
This is not a guide on how to use e.g. a user's email as their WebAuthn ID. Values used for `userID` **MUST NOT** contain personally-identifying information (PII)! A value like `"WA1234567890ABC"` is okay, but a value like `"iamkale@simplewebauthn.dev"` is not!

If you don't want to worry about any of this then consider skipping the rest of this guide and revisiting the general guidance offered in [Packages &gt; @simplewebauthn/server](packages/server.md).
:::

### Registration

Use the `isoUint8Array` helper to convert the custom user identifier UTF-8 `string` into a `Uint8Array`:

```ts
import { isoUint8Array } from '@simplewebauthn/server/helpers';

const options = generateRegistrationOptions({
  // ...
  userID: isoUint8Array.fromUTF8String('customUserIDHere'),
});
```

The value `options.user.id` will be the **base64url-encoded UTF-8 bytes**. When passed into [**@simplewebauthn/browser**'s `startRegistration()`](packages/browser.mdx#startregistration) the bytes will be decoded back to the raw UTF-8 bytes and passed to the authenticator.

### Authentication

[**@simplewebauthn/browser**'s `startAuthentication()`](packages/browser.mdx#startauthentication) method will encode the raw `credential.response.userHandle` bytes out of the WebAuthn response to make it easy to send them to the back end.

Back on the server, the `isoBase64URL` helper can be used to convert `userHandle` back into a recognizable UTF-8 `string`:

```ts
import { isoBase64URL } from '@simplewebauthn/server/helpers';

const credential = await receiveFromBrowser();
console.log(
  isoBase64URL.toUTF8String(credential.response.userhandle), // 'customUserIDHere'
);
```

## Error: String values for \`userID\` are no longer supported

[@simplewebauthn/server's `generateRegistrationOptions()`](packages/server.md#1-generate-registration-options) will throw this error when a `string` value is passed in for the `userID` argument. To fix the problem, review the **Registration** section above for guidance on refactoring your code to massage your `string` identifier into a `Uint8Array`.
---
title: Metadata Service
---

:::caution
**The following functionality is opt-in and is not required for typical use!** SimpleWebAuthn remains focused on simplifying working with the WebAuthn API, and the functionality covered in [Packages &gt; @simplewebauthn/server](packages/server.md) will serve the majority of developers' use cases.
:::

## Introduction

Metadata statements maintained by the FIDO Alliance can be referenced during registration to cross-reference additional information about authenticators used with SimpleWebAuthn. These statements contain cryptographically-signed "guarantees" about authenticators and what they are capable of, according to their manufacturer.

**@simplewebauthn/server** includes support for the [FIDO Alliance Metadata Service (version 3.0)](https://fidoalliance.org/metadata/) API via its `MetadataService`:

```ts
import { MetadataService } from '@simplewebauthn/server';
```

This singleton service contains all of the logic necessary to interact with the MDS API, including signed data verification and automatic periodic refreshing of metadata statements.

:::info
Use of MetadataService is _not_ required to use @simplewebauthn/server! This is opt-in functionality that enables a more strict adherence to FIDO specifications and may not be appropriate for your use case.
:::

## `initialize()`

Simply call `initialize()` to enable `MetadataService` configured to use the official MDS API:

```js
import { MetadataService } from '@simplewebauthn/server';

MetadataService.initialize().then(() => {
  console.log('🔐 MetadataService initialized');
});
```

`MetadataService` can also be initialized with optional URLs to other MDS-compatible servers, any local metadata statements you may maintain, or both:

```js
import { MetadataService, MetadataStatement } from '@simplewebauthn/server';

const statements: MetadataStatement[] = [];

// Load in statements from JSON files
try {
  const mdsMetadataPath = './metadata-statements';
  const mdsMetadataFilenames = fs.readdirSync(mdsMetadataPath);
  for (const statementPath of mdsMetadataFilenames) {
    if (statementPath.endsWith('.json')) {
      const contents = fs.readFileSync(`${mdsMetadataPath}/${statementPath}`, 'utf-8');
      statements.push(JSON.parse(contents));
    }
  }
} catch (err) {
  // pass
}

MetadataService.initialize({
  mdsServers: ['https://mds-compatible-server.example.com'],
  statements: statements,
}).then(() => {
  console.log('🔐 MetadataService initialized');
});
```

Once `MetadataService` is initialized, `verifyRegistrationResponse()` will reference MDS metadata statements and error out if it receives authenticator responses with unexpected values.

:::caution
Make sure to set `attestationType` to `"direct"` when calling `generateRegistrationOptions()` to leverage the full power of metadata statements!
:::
---
title: Secure Payment Confirmation
---

## Introduction

If you've made it here then you probably know what Secure Payment Confirmation (SPC) is! If not, you can read more about it here:

https://www.w3.org/TR/secure-payment-confirmation/

SPC responses are almost identical to WebAuthn responses, save for a slightly different value in their `type` value within `clientDataJSON`. Fortunately it's easy to verify such SPC responses using **@simplewebauthn/server**.

## Specify a custom `expectedType`

Secure Payment Confirmation requests can be supported by SimpleWebAuthn by setting the `expectedType` argument to `"payment.get"` when calling **@simplewebauthn/server**'s `verifyAuthenticationResponse()`:

```ts
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const authVerify = await verifyAuthenticationResponse({
  // ...
  expectedType: 'payment.get',
});
```

If desired, a single call to `verifyAuthenticationResponse()` can support verification of both WebAuthn and Secure Payment Confirmation responses (i.e. output from **@simplewebauthn/browser**'s `startAuthentication()` method) by specifying the following array of possible values:

```ts
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const authVerify = await verifyAuthenticationResponse({
  // ...
  expectedType: ['webauthn.get', 'payment.get'],
});
```
---
title: Settings Service
---

:::caution
**The following functionality is opt-in and is not required for typical use!** SimpleWebAuthn remains focused on simplifying working with the WebAuthn API, and the functionality covered in [Packages &gt; @simplewebauthn/server](packages/server.md) will serve the majority of developers' use cases.
:::

## Introduction

The `SettingsService` singleton offers methods for customizing **@simplewebauthn/server**'s functionality.

## `setRootCertificates()`

Some registration response attestation statements can be validated via root certificates prescribed by the company responsible for the format. It is possible to use `SettingsService` to register custom root certificates that will be used for validating certificate paths in subsequent registrations with matching attestation formats:

```ts
import { SettingsService } from '@simplewebauthn/server';

// A Uint8Array, or PEM-formatted certificate string
const appleCustomRootCert: Uint8Array | string = '...';
SettingsService.setRootCertificates({
  identifier: 'apple',
  certificates: [appleCustomRootCert],
});
```

The following values for `identifier` are supported:

```
"android-key" | "android-safetynet" | "apple" | "fido-u2f" | "packed" | "tpm" | "mds"
```

If root certificates have not been registered for an attestation statement format (or you set an empty array to one [e.g. `[]`]) then certificate path validation will not occur.

:::info
This method can come in handy when an attestation format requires use of a root certificate that SimpleWebAuthn has not yet been updated to use.
:::

SimpleWebAuthn includes known root certificates for the following such attestation formats:

- `"android-key"`
- `"android-safetynet"`
- `"apple"`
- `"mds"` (for use with `MetadataService` to validate MDS BLOBs)

## `getRootCertificates()`

This method returns existing root certificates for a specific identifier:

```js
import { SettingsService } from '@simplewebauthn/server';

const appleCerts: string[] = SettingsService.getRootCertificates({ identifier: 'apple' });
```

The returned certificates will be PEM-formatted strings.
---
title: Supported Devices
---

The excellent [passkeys.dev](https://passkeys.dev) maintains a comprehensive list of devices, operating systems, and browsers that support WebAuthn and, by extension, passkeys. Check it out here:

https://passkeys.dev/device-support/
---
title: "@simplewebauthn/server"
---

import useBaseUrl from '@docusaurus/useBaseUrl';

## Current version

The content below should be accurate for **@simplewebauthn/server@^13.0.0**. Please open an issue [here](https://github.com/MasterKale/SimpleWebAuthn-homepage/issues) to report any inaccuracies.

## Installation

This package can be installed from **[NPM](https://www.npmjs.com/package/@simplewebauthn/server)**
and **[JSR](https://jsr.io/@simplewebauthn/server)**:

### Node LTS 20.x and higher

```sh
npm install @simplewebauthn/server
```

### Deno v1.43 and higher

```sh
deno add jsr:@simplewebauthn/server
```

## Types

This package exports almost all of its types for TypeScript projects to import. For example:

```ts
import type { WebAuthnCredential } from '@simplewebauthn/server';
// -or-
import { ..., type WebAuthnCredential } from '@simplewebauthn/server';
```

See the [auto-generated API docs for this project on JSR](https://jsr.io/@simplewebauthn/server/doc) for a comprehensive list of available imports.

## Additional data structures

Documentation below will refer to the following TypeScript types. These are intended to be inspirational, a simple means of communicating the shape of the values you'll need to be capable of persisting in your database:

```ts
import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
  Base64URLString,
} from '@simplewebauthn/server';

type UserModel = {
  id: any;
  username: string;
};

/**
 * It is strongly advised that credentials get their own DB
 * table, ideally with a foreign key somewhere connecting it
 * to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
type Passkey = {
  // SQL: Store as `TEXT`. Index this column
  id: Base64URLString;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  //      Caution: Node ORM's may map this to a Buffer on retrieval,
  //      convert to Uint8Array as necessary
  publicKey: Uint8Array;
  // SQL: Foreign Key to an instance of your internal user model
  user: UserModel;
  // SQL: Store as `TEXT`. Index this column. A UNIQUE constraint on
  //      (webAuthnUserID + user) also achieves maximum user privacy
  webauthnUserID: Base64URLString;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  deviceType: CredentialDeviceType;
  // SQL: `BOOL` or whatever similar type is supported
  backedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
  transports?: AuthenticatorTransportFuture[];
};
```

Below is a sample database schema showing how a **passkeys** table can track WebAuthn-specific user IDs while still allowing use of typical internal database user IDs through the rest of the site ([click here for an interactive version of the schema](https://dbdiagram.io/d/SimpleWebAuthn-Example-DB-Schema-661a046303593b6b61e34628)):

<img alt="FIDO2 Metadata download button" src={useBaseUrl('img/docs/packages/server-sample-db-schema.png')} />

Keep this table structure in mind as you proceed through the following sections.

## Identifying your RP

Start by defining some constants that describe your "Relying Party" (RP) server to authenticators:

```js
/**
 * Human-readable title for your website
 */
const rpName = 'SimpleWebAuthn Example';
/**
 * A unique identifier for your website. 'localhost' is okay for
 * local dev
 */
const rpID = 'simplewebauthn.dev';
/**
 * The URL at which registrations and authentications should occur.
 * 'http://localhost' and 'http://localhost:PORT' are also valid.
 * Do NOT include any trailing /
 */
const origin = `https://${rpID}`;
```

These will be referenced throughout registrations and authentications to ensure that authenticators generate and return credentials specifically for your server.

## Registration

"Registration" is analogous to new account creation. Registration uses the following exported methods from this package:

```ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
```

Registration occurs in two steps:

1. Generate registration options for the browser to pass to a supported authenticator
2. Verify the authenticator's response

Each of these steps need their own API endpoints:

### 1. Generate registration options

One endpoint (`GET`) needs to return the result of a call to `generateRegistrationOptions()`:

```ts
// (Pseudocode) Retrieve the user from the database
// after they've logged in
const user: UserModel = getUserFromDB(loggedInUserId);
// (Pseudocode) Retrieve any of the user's previously-
// registered authenticators
const userPasskeys: Passkey[] = getUserPasskeys(user);

const options: PublicKeyCredentialCreationOptionsJSON = await generateRegistrationOptions({
  rpName,
  rpID,
  userName: user.username,
  // Don't prompt users for additional information about the authenticator
  // (Recommended for smoother UX)
  attestationType: 'none',
  // Prevent users from re-registering existing authenticators
  excludeCredentials: userPasskeys.map(passkey => ({
    id: passkey.id,
    // Optional
    transports: passkey.transports,
  })),
  // See "Guiding use of authenticators via authenticatorSelection" below
  authenticatorSelection: {
    // Defaults
    residentKey: 'preferred',
    userVerification: 'preferred',
    // Optional
    authenticatorAttachment: 'platform',
  },
});

// (Pseudocode) Remember these options for the user
setCurrentRegistrationOptions(user, options);

return options;
```

These options can be passed directly into [**@simplewebauthn/browser**'s `startRegistration()`](packages/browser.mdx#startregistration) method.

#### Guiding use of authenticators via `authenticatorSelection`

`generateRegistrationOptions()` also accepts an `authenticatorSelection` option that can be used to fine-tune the registration experience. When unspecified, defaults are provided according to [passkeys best practices](advanced/passkeys.md#generateregistrationoptions). These values can be overridden based on Relying Party needs, however:

**`authenticatorSelection.residentKey`**:

- `'discouraged'`
  - Won't consume discoverable credential slots on security keys, but also won't generate synced passkeys on Android devices.
- `'preferred'`
  - Will always generate synced passkeys on Android devices, but will consume discoverable credential slots on security keys.
- `'required'`
  - Same as `'preferred'`

**`authenticatorSelection.userVerification`:**

- `'discouraged'`
  - Won't perform user verification if interacting with an authenticator won't automatically perform it (i.e. security keys won't prompt for PIN, but interacting with Touch ID on a macOS device will always perform user verification.) User verification will usually be `false`.
- `'preferred'`
  - Will perform user verification when possible, but will skip any prompts for PIN or local login password when possible. In these instances user verification can sometimes be `false`.
- `'required'`
  - Will always provides multi-factor authentication, at the expense of always requiring some users to enter their local login password during auth. User verification should never be `false`.

**`authenticatorSelection.authenticatorAttachment`:**

- `'cross-platform'`
  - Browsers will guide users towards registering a security key, or mobile device via hybrid registration.
- `'platform'`
  - Browser will guide users to registering the locally integrated hardware authenticator.

#### Fine-tuning the registration experience with `preferredAuthenticatorType`

[WebAuthn hints](https://w3c.github.io/webauthn/#dom-publickeycredentialrequestoptions-hints) allow a Relying Party to further refine the registration experience compared to specifying a value for `authenticatorSelection.authenticatorAttachment` as detailed above. SimpleWebAuthn enables use of hints via the `preferredAuthenticatorType` argument that can be passed into `generateRegistrationOptions()`:

**`preferredAuthenticatorType`:**

- `'securityKey'`
  - A security key, like a [YubiKey 5](https://www.yubico.com/products/yubikey-5-overview/), [Feitian K40](https://www.ftsafe.com/Products/FIDO/NFC), and other such FIDO2-compatible USB tokens
- `'localDevice'`
  - Typically the platform authenticator available on the device that they are logging in from
- `'remoteDevice'`
  - A platform authenticator with access to a valid passkey but that is **not** on the device the user is logging in from (a.k.a. "hybrid auth" a.k.a. "the one that shows a QR code")

When this value is specified, browsers that support hints will try to tailor their experience to encourage registration of an authenticator of the specified type. **Hints are a suggestion**, though, and browsers will often allow a user to ultimately choose a different type of authenticator to register. RPs should be prepared for this possibility when using this.

:::important
Setting a value for `preferredAuthenticatorType` will overwrite any value that may have been specified for `authenticatorSelection.authenticatorAttachment`! This is to help maintain backwards compatibility with browsers that may not yet know about hints.
:::

### 1a. Supported Attestation Formats

If `attestationType` is set to `"direct"` when generating registration options, the authenticator will return a more complex response containing an "attestation statement". This statement includes additional verifiable information about the authenticator.

Attestation statements are returned in one of several different formats. SimpleWebAuthn supports [all current WebAuthn attestation formats](https://w3c.github.io/webauthn/#sctn-defined-attestation-formats), including:

- **Packed**
- **TPM**
- **Android Key**
- **Android SafetyNet**
- **Apple**
- **FIDO U2F**
- **None**

:::info
Attestation statements are an advanced aspect of WebAuthn. You can ignore this concept if you're not particular about the kinds of authenticators your users can use for registration and authentication.
:::

### 2. Verify registration response

The second endpoint (`POST`) should accept the value returned by [**@simplewebauthn/browser**'s `startRegistration()`](packages/browser.mdx#startregistration) method and then verify it:

```ts
const { body } = req;

// (Pseudocode) Retrieve the logged-in user
const user: UserModel = getUserFromDB(loggedInUserId);
// (Pseudocode) Get `options.challenge` that was saved above
const currentOptions: PublicKeyCredentialCreationOptionsJSON =
  getCurrentRegistrationOptions(user);

let verification;
try {
  verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: currentOptions.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
} catch (error) {
  console.error(error);
  return res.status(400).send({ error: error.message });
}

const { verified } = verification;
```

:::tip Support for multiple origins and RP IDs
SimpleWebAuthn optionally supports verifying registrations from multiple origins and RP IDs! Simply pass in an **array** of possible origins and IDs for `expectedOrigin` and `expectedRPID` respectively.
:::

When finished, it's a good idea to return the verification status to the browser to display
appropriate UI:

```ts
return { verified };
```

### 3. Post-registration responsibilities

Assuming `verification.verified` is true then RP's must, at the very least, save the credential data in `registrationInfo` to the database:

```ts
const { registrationInfo } = verification;
const {
  credential,
  credentialDeviceType,
  credentialBackedUp,
} = registrationInfo;

const newPasskey: Passkey = {
  // `user` here is from Step 2
  user,
  // Created by `generateRegistrationOptions()` in Step 1
  webAuthnUserID: currentOptions.user.id,
  // A unique identifier for the credential
  id: credential.id,
  // The public key bytes, used for subsequent authentication signature verification
  publicKey: credential.publicKey,
  // The number of times the authenticator has been used on this site so far
  counter: credential.counter,
  // How the browser can talk with this credential's authenticator
  transports: credential.transports,
  // Whether the passkey is single-device or multi-device
  deviceType: credentialDeviceType,
  // Whether the passkey has been backed up in some way
  backedUp: credentialBackedUp,
};

// (Pseudocode) Save the authenticator info so that we can
// get it by user ID later
saveNewPasskeyInDB(newPasskey);
```

:::info Regarding `counter`
Tracking the ["signature counter"](https://www.w3.org/TR/webauthn/#signature-counter) allows Relying Parties to potentially identify misbehaving authenticators, or cloned authenticators. The counter on subsequent authentications should only ever increment; if your stored counter is greater than zero, and a subsequent authentication response's counter is the same or lower, then perhaps the authenticator just used to authenticate is in a compromised state.

It's also not unexpected for certain high profile authenticators, like Touch ID on macOS, to always return `0` (zero) for the signature counter. In this case there is nothing an RP can really do to detect a cloned authenticator, especially in the context of [multi-device credentials](https://fidoalliance.org/apple-google-and-microsoft-commit-to-expanded-support-for-fido-standard-to-accelerate-availability-of-passwordless-sign-ins/).

**@simplewebauthn/server** knows how to properly check the signature counter on subsequent authentications. RP's should only need to remember to store the value after registration, and then feed it back into `startAuthentication()` when the user attempts a subsequent login. RP's should remember to update the credential's counter value in the database afterwards. See [Post-authentication responsibilities](packages/server.md#3-post-authentication-responsibilities) below for how to do so.
:::

## Authentication

"Authentication" is analogous to existing account login. Authentication uses the following exported methods from this package:

```ts
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
```

Just like registration, authentication span two steps:

1. Generate authentication options for the browser to pass to a FIDO2 authenticator
2. Verify the authenticator's response

Each of these steps need their own API endpoints:

### 1. Generate authentication options

One endpoint (`GET`) needs to return the result of a call to `generateAuthenticationOptions()`:

```ts
// (Pseudocode) Retrieve the logged-in user
const user: UserModel = getUserFromDB(loggedInUserId);
// (Pseudocode) Retrieve any of the user's previously-
// registered authenticators
const userPasskeys: Passkey[] = getUserPasskeys(user);

const options: PublicKeyCredentialRequestOptionsJSON = await generateAuthenticationOptions({
  rpID,
  // Require users to use a previously-registered authenticator
  allowCredentials: userPasskeys.map(passkey => ({
    id: passkey.id,
    transports: passkey.transports,
  })),
});

// (Pseudocode) Remember this challenge for this user
setCurrentAuthenticationOptions(user, options);

return options;
```

These options can be passed directly into [**@simplewebauthn/browser**'s `startAuthentication()`](packages/browser.mdx#startAuthentication) method.

:::tip Support for custom challenges

Power users can optionally generate and pass in their own unique challenges as `challenge` when calling `generateAuthenticationOptions()`. In this scenario `options.challenge` still needs to be saved to be used in verification as described below.

:::

### 2. Verify authentication response

The second endpoint (`POST`) should accept the value returned by [**@simplewebauthn/browser**'s `startAuthentication()`](packages/browser.mdx#startAuthentication) method and then verify it:

```ts
const { body } = req;

// (Pseudocode) Retrieve the logged-in user
const user: UserModel = getUserFromDB(loggedInUserId);
// (Pseudocode) Get `options.challenge` that was saved above
const currentOptions: PublicKeyCredentialRequestOptionsJSON =
  getCurrentAuthenticationOptions(user);
// (Pseudocode} Retrieve a passkey from the DB that
// should match the `id` in the returned credential
const passkey: Passkey = getUserPasskey(user, body.id);

if (!passkey) {
  throw new Error(`Could not find passkey ${body.id} for user ${user.id}`);
}

let verification;
try {
  verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: currentOptions.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.id,
      publicKey: passkey.publicKey,
      counter: passkey.counter,
      transports: passkey.transports,
    },
  });
} catch (error) {
  console.error(error);
  return res.status(400).send({ error: error.message });
}

const { verified } = verification;
```

When finished, it's a good idea to return the verification status to the browser to display
appropriate UI:

```ts
return { verified };
```

:::tip Support for multiple origins and RP IDs
SimpleWebAuthn optionally supports verifying authentications from multiple origins and RP IDs! Simply pass in an array of possible origins and IDs for `expectedOrigin` and `expectedRPID` respectively.
:::

### 3. Post-authentication responsibilities

Assuming `verification.verified` is true, then update the user's authenticator's `counter` property in the DB:

```ts
const { authenticationInfo } = verification;
const { newCounter } = authenticationInfo;

saveUpdatedCounter(passkey, newCounter);
```

## Troubleshooting

Below are errors you may see while using this library, and potential solutions to them:

### DOMException [NotSupportedError]: Unrecognized name.

Authentication responses may unexpectedly error out during verification. This appears as the throwing of an "Unrecognized name" error from a call to `verifyAuthenticationResponse()` with the following stack trace:

```
DOMException [NotSupportedError]: Unrecognized name.
    at new DOMException (node:internal/per_context/domexception:70:5)
    at __node_internal_ (node:internal/util:477:10)
    at normalizeAlgorithm (node:internal/crypto/util:220:15)
    at SubtleCrypto.importKey (node:internal/crypto/webcrypto:503:15)
    at importKey (/Users/swan/Developer/simplewebauthn/packages/server/src/helpers/iso/isoCrypto/importKey.ts:9:27)
    at verifyOKP (/Users/swan/Developer/simplewebauthn/packages/server/src/helpers/iso/isoCrypto/verifyOKP.ts:57:30)
    at Object.verify (/Users/swan/Developer/simplewebauthn/packages/server/src/helpers/iso/isoCrypto/verify.ts:31:21)
    at verifySignature (/Users/swan/Developer/simplewebauthn/packages/server/src/helpers/verifySignature.ts:34:20)
    at verifyAuthenticationResponse (/Users/swan/Developer/simplewebauthn/packages/server/src/authentication/verifyAuthenticationResponse.ts:206:36)
    at async /Users/swan/Developer/simplewebauthn/packages/server/345.ts:26:24
```

This appears to be an issue with some environments running **versions of Node prior to v18 LTS**.

To fix this, update your call to `generateRegistrationOptions()` to exclude `-8` (Ed25519) from the list of algorithms:

```ts
const options = await generateRegistrationOptions({
  // ...
  supportedAlgorithmIDs: [-7, -257],
});
```

You will then need to re-register any authenticators that generated credentials that cause this error.

### Error: Signature verification with public key of kty OKP is not supported by this method

Authentication responses may unexpectedly error out during verification. This appears as the throwing of a "Signature verification with public key of kty OKP is not supported" error from a call to `verifyAuthenticationResponse()` with the following stack trace:

```
Error: Signature verification with public key of kty OKP is not supported by this method
    at Object.verify (/xxx/node_modules/@simplewebauthn/server/script/helpers/iso/isoCrypto/verify.js:30:11)
    at verifySignature (/xxx/node_modules/@simplewebauthn/server/script/helpers/verifySignature.js:25:76)
    at verifyAuthenticationResponse (/xxx/node_modules/@simplewebauthn/server/script/authentication/verifyAuthenticationResponse.js:162:66)
```

This is caused by **security key responses in Firefox 118 and earlier being incorrectly composed by the browser** when the security key uses **Ed25519** for its credential keypair.

To fix this, update your call to `generateRegistrationOptions()` to exclude `-8` (Ed25519) from the list of algorithms:

```ts
const options = await generateRegistrationOptions({
  // ...
  supportedAlgorithmIDs: [-7, -257],
});
```

You will then need to re-register any authenticators that generated credentials that cause this error.

### ERROR extractStrings is not a function

Registration responses may unexpectedly error out during verification. This appears as the throwing of an "extractStrings is not a function" error from a call to `verifyRegistrationResponse()` with the following stack trace:

```
ERROR  extractStrings is not a function
    at readString (/node_modules/.pnpm/cbor-x@1.5.6/node_modules/cbor-x/dist/node.cjs:520:1)
    at read (/node_modules/.pnpm/cbor-x@1.5.6/node_modules/cbor-x/dist/node.cjs:343:1)
    at read (/node_modules/.pnpm/cbor-x@1.5.6/node_modules/cbor-x/dist/node.cjs:363:1)
    at checkedRead (/node_modules/.pnpm/cbor-x@1.5.6/node_modules/cbor-x/dist/node.cjs:202:1)
    at Encoder.decode (/node_modules/.pnpm/cbor-x@1.5.6/node_modules/cbor-x/dist/node.cjs:153:1)
    at Encoder.decodeMultiple (/node_modules/.pnpm/cbor-x@1.5.6/node_modules/cbor-x/dist/node.cjs:170:1)
    at Object.decodeFirst (/node_modules/.pnpm/@simplewebauthn+server@8.3.5/node_modules/@simplewebauthn/server/script/helpers/iso/isoCBOR.js:30:1)
    at decodeAttestationObject (/node_modules/.pnpm/@simplewebauthn+server@8.3.5/node_modules/@simplewebauthn/server/script/helpers/decodeAttestationObject.js:12:1)
    at verifyRegistrationResponse (/node_modules/.pnpm/@simplewebauthn+server@8.3.5/node_modules/@simplewebauthn/server/script/registration/verifyRegistrationResponse.js:100:1)
    at AuthnService.verifyRegistrationResponse (/home/deploy/mx/modules/authn/authn.service.js:89:1)
```

This is caused by the `@vercel/ncc` dependency not supporting runtime use of `require()` within other third-party packages used by the project, like **@simplewebauthn/server**'s use of **cbor-x**.

To fix this, add `CBOR_NATIVE_ACCELERATION_DISABLED=true` in your project's env file to disable the use of `require()` in **cbor-x**.

**Alternatively**, the following can be added to your project to inject this value into your project's runtime environment:

```js
function nodeEnvInjection() {
  /**
   * `@vercel/ncc` does not support the use of `require()` so disable its
   * use in the `@simplewebauthn/server` dependency called `cbor-x`.
   *
   * https://github.com/kriszyp/cbor-x/blob/master/node-index.js#L10
   */
  process.env['CBOR_NATIVE_ACCELERATION_DISABLED'] = 'true';
}

// Call this at the start of the project, before any imports
nodeEnvInjection()
```

### Error: No data

Calls to `verifyAuthenticationResponse()` may unexpectedly error out with `Error: No data` in projects that store credential public keys as `Binary` data types in [MongoDB](https://www.mongodb.com):

```
Error: No data
    at Module.decodePartialCBOR (file:///path/to/app/node_modules/@levischuck/tiny-cbor/esm/cbor/cbor.js:351:15)
    at Module.decodeFirst (file:///path/to/app/node_modules/@simplewebauthn/server/esm/helpers/iso/isoCBOR.js:22:30)
    at decodeCredentialPublicKey (file:///path/to/app/node_modules/@simplewebauthn/server/esm/helpers/decodeCredentialPublicKey.js:3:65)
    at verifySignature (file:///path/to/app/node_modules/@simplewebauthn/server/esm/helpers/verifySignature.js:17:25)
    at verifyAuthenticationResponse (file:///path/to/app/node_modules/@simplewebauthn/server/esm/authentication/verifyAuthenticationResponse.js:154:25)
    at async file:///path/to/app/dist/controller/auth.controller.js:202:28
```

To fix this, massage the `Binary` public key bytes into an instance of `Uint8Array` that `verifyAuthenticationResponse()` expects:

```js
const verification = await verifyAuthenticationResponse({
  // ...
  authenticator: {
    // ...
    credentialPublicKey: new Uint8Array(credentialPublicKey.buffer),
  },
});
```

### Error: String values for \`userID\` are no longer supported

See [Advanced Guides > @simplewebauthn/server > Custom User IDs](advanced/server/custom-user-ids.md#error-string-values-for-userid-are-no-longer-supported) for more information.
---
title: "@simplewebauthn/types"
---

:::danger Deprecation notice
It is no longer necessary to install this package if you are running v13+ of either **@simplewebauthn/browser** or **@simplewebauthn/server**. The types that were maintained in this package will be exported directly from those packages going forward. The last published version of @simplewebauthn/types remains available on [NPM](https://www.npmjs.com/package/@simplewebauthn/types/v/12.0.0) and [JSR](https://jsr.io/@simplewebauthn/types@12.0.0) but will no longer be updated going forward.

**Before:**
```ts
import type { WebAuthnCredential } from '@simplewebauthn/types';
```

**After:**
```ts
import { ..., type WebAuthnCredential } from '@simplewebauthn/server';
```
```ts
import { ..., type WebAuthnCredential } from '@simplewebauthn/browser';
```
:::
---
title: Philosophy
---

WebAuthn is a browser API that empowers us all to secure our accounts with a user-friendly experience powered by public-key cryptography.

Website back ends that wish to leverage this technology must be set up to do two things:

1. Provide to the front end a specific collection of values that the hardware authenticator will understand for "registration" and "authentication".
2. Parse responses from hardware authenticators.

Website front ends have their own part to play in the process:

1. Pass the server-provided values into the WebAuthn API's `navigator.credentials.create()` and `navigator.credentials.get()` so the user can interact with their compatible authenticator.
2. Pass the authenticator's response returned from these methods back to the server.

On the surface, this is a relatively straightforward dance. Unfortunately the values passed into the `navigator.credentials` methods and the responses received from them make heavy use of `ArrayBuffer`'s which are difficult to transmit as JSON between front end and back end. Not only that, there are many complex ways in which authenticator responses must be parsed, and though finalized, [the W3C spec](https://w3c.github.io/webauthn/) is quite complex and is being expanded all the time.

**Enter SimpleWebAuthn.**

SimpleWebAuthn offers a developer-friendly pair of libraries that simplify the above dance. **@simplewebauthn/server** exports a small number of methods requiring a handful of simple inputs that pair with the two primary methods exported by **@simplewebauthn/browser**. No converting back and forth between `Uint8Array` (or was this supposed to be an `ArrayBuffer`...?) and `String`, no worrying about JSON compatibility - **SimpleWebAuthn takes care of it all!**

