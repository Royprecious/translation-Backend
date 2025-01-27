"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const secrets_1 = require("./secrets");
const serviceAccount = {
    type: secrets_1.TYPE,
    project_id: secrets_1.PROJECT_ID,
    private_key_id: secrets_1.PRIVATE_KEY_ID,
    private_key: secrets_1.PRIVATE_KEY === null || secrets_1.PRIVATE_KEY === void 0 ? void 0 : secrets_1.PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: secrets_1.CLIENT_EMAIL,
    client_id: secrets_1.CLIENT_ID,
    auth_uri: secrets_1.AUTH_URI,
    token_uri: secrets_1.TOKEN_URI,
    auth_provider_x509_cert_url: secrets_1.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: secrets_1.CLIENT_X509_CERT_URL,
    universe_domain: secrets_1.UNIVERSE_DOMAIN
};
console.log(serviceAccount);
(0, app_1.initializeApp)({ credential: (0, app_1.cert)(serviceAccount) });
const db = (0, firestore_1.getFirestore)();
exports.default = db;
