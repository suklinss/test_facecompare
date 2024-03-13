const https = require("https");
const crypto = require("crypto");
const fs = require('fs');
const filePath = './Data.json';
const filePath_out = './Data_out.json';

const test_face = (Request_msg) => {
  return new Promise((resolve, reject) => {
    function sha256(message, secret = "", encoding) {
      const hmac = crypto.createHmac("sha256", secret);
      return hmac.update(message).digest(encoding);
    }
    function getHash(message, encoding = "hex") {
      const hash = crypto.createHash("sha256");
      return hash.update(message).digest(encoding);
    }
    function getDate(timestamp) {
      const date = new Date(timestamp * 1000);
      const year = date.getUTCFullYear();
      const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
      const day = ("0" + date.getUTCDate()).slice(-2);
      return `${year}-${month}-${day}`;
    }
    
    const SECRET_ID = "IKID3AUuNwYlv0FhCsbRQVajs0661tlhmrsm";
    const SECRET_KEY = "4EQYl6VuMsuIh1CNE0c6RueJ4reWH3wx";
    const TOKEN = "";
    
    const host = "iai.ap-singapore.tencentcloudapi.com";
    const service = "iai";
    const region = "ap-singapore";
    const action = "CompareFace";
    const version = "2020-03-03";
    const timestamp = parseInt(String(new Date().getTime() / 1000));
    const date = getDate(timestamp);
    const payload = JSON.stringify(Request_msg);
    
    // ************* Step 1: Concatenate the CanonicalRequest string *************
    const signedHeaders = "content-type;host";
    const hashedRequestPayload = getHash(payload);
    const httpRequestMethod = "POST";
    const canonicalUri = "/";
    const canonicalQueryString = "";
    const canonicalHeaders =
      "content-type:application/json; charset=utf-8\n" + "host:" + host + "\n";
    
    const canonicalRequest =
      httpRequestMethod +
      "\n" +
      canonicalUri +
      "\n" +
      canonicalQueryString +
      "\n" +
      canonicalHeaders +
      "\n" +
      signedHeaders +
      "\n" +
      hashedRequestPayload;
    
    // ************* Step 2: Concatenate the string to sign *************
    const algorithm = "TC3-HMAC-SHA256";
    const hashedCanonicalRequest = getHash(canonicalRequest);
    const credentialScope = date + "/" + service + "/" + "tc3_request";
    const stringToSign =
      algorithm +
      "\n" +
      timestamp +
      "\n" +
      credentialScope +
      "\n" +
      hashedCanonicalRequest;
    
    // ************* Step 3: Calculate the Signature *************
    const kDate = sha256(date, "TC3" + SECRET_KEY);
    const kService = sha256(service, kDate);
    const kSigning = sha256("tc3_request", kService);
    const signature = sha256(stringToSign, kSigning, "hex");
    
    // ************* Step 4: Concatenate the Authorization *************
    const authorization =
      algorithm +
      " " +
      "Credential=" +
      SECRET_ID +
      "/" +
      credentialScope +
      ", " +
      "SignedHeaders=" +
      signedHeaders +
      ", " +
      "Signature=" +
      signature;
    
    // ************* Step 5: Build and Send a Request *************
    const headers = {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: host,
      "X-TC-Action": action,
      "X-TC-Timestamp": timestamp,
      "X-TC-Version": version,
    };
    
    if (region) {
      headers["X-TC-Region"] = region;
    }
    if (TOKEN) {
      headers["X-TC-Token"] = TOKEN;
    }
    
    const options = {
      hostname: host,
      method: httpRequestMethod,
      headers,
    };
    
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
    
      res.on("end", () => {
        resolve(data);
      });
    });
    
    req.on("error", (error) => {
      reject(error);
    });
    
    req.write(payload);
    req.end();
  });
};

const main = async () => {

  // Read the JSON file
  fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    try {
      // Parse JSON data
      const jsonData = JSON.parse(data);
      // console.log(jsonData.length)
      fs.writeFileSync(filePath_out, '[');
      for(let i=0 ; i<jsonData.length ;i++){
        if (i !== 0) {
          fs.appendFileSync(filePath_out, ',\n');
        }
        delete jsonData[i].No; 
        // console.log(jsonData[i])
        try {
          const response = await test_face(jsonData[i]);
          const result_data = {"request_body":jsonData[i],"response_body":response}
          console.log(result_data);
          fs.appendFileSync(filePath_out, JSON.stringify(result_data));
        } catch (error) {
          console.error('Error testing face:', error);
        }
      }
      fs.appendFileSync(filePath_out, ']');
      // console.log('JSON data:', JsonData);


    } catch (error) {
      console.error('Error parsing JSON data:', error);
    }
  });
};

main();
