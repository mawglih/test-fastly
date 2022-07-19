//! Default Compute@Edge template program.
​
/// <reference types="@fastly/js-compute" />
//import welcomePage from "./welcome-to-compute@edge.html";
​
// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It could be
// used to route based on the request properties (such as method or path), send
// the request to a backend, make completely new requests, and/or generate
// synthetic responses.
​
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));
​
async function handleRequest(event) {
  // Get the client request.
  let req = event.request;
​
  console.log("Version 2.17");
  console.log("url = " + req.url);
​
  // check if ab test cookie already set for user
  let createABTest = true;
  let remove = false;
​
  let abTestValue = null;
  let abTestCookieExistingValue = null;
  let varyHeaderValue = null;
  
  // get existing values from cookie if exists
  if (req.headers.has('Cookie')) {
    let cookies = parseCookies(req.headers.get('Cookie'));
    if (cookies['fab']){
      abTestCookieExistingValue = cookies['fab'];
      abTestValue = abTestCookieExistingValue;
      console.log("ABTest Cookie Already Set. Value= " + abTestCookieExistingValue);
      createABTest = false;
    }
​
    if (cookies['fabvh']){
      varyHeaderValue = cookies['fabvh'];
      console.log("vary header cookie = " + varyHeaderValue);
      console.log("vary header request = " + req.headers.get('fabvh'));
    }
  }
  
  // Get tests from dictionary
  let abtestDict = new Dictionary("ab_config");
  // get test name from dictionary
  // Note: if no test then remove cookies - logic needs to be in VCL now
  let abtests = abtestDict.get("tests");
  
  // Create AB Test Cookie
  if (abtests){
    if (createABTest){
      let testsArray = abtests.split(",");
      varyHeaderValue = "";
      abTestValue = "{";
​
      var arrayLength = testsArray.length;
      var addedCount = 0;
      for (var i = 0; i < arrayLength; i++) {
        let testName = testsArray[i];
        
        // get abtest config for testName
        let testConfig = abtestDict.get(testName);
        if (testConfig){
​
          console.log(testConfig);
​
          //check if user is eligible for abtest - check url and/or cookie from config     
          if (isUserElibleForTest(req, testConfig)){
            // get abtest value based on weight
            let testValue =  getABTestValue(testConfig);
            console.log("testName=" + testName + ", value=" + testValue);
​
            // create ab test cookie json, set header values, and vary header string
            if (addedCount > 0){
              abTestValue += ",";
            }
​
            abTestValue += "\"" + testName + "\":\"" + testValue + "\"";
            varyHeaderValue += testName+testValue;
            
            addedCount++;
          }
        }
      }
​
      abTestValue += "}";
    }
  }
  else{
    // TODO: figure out how to remove  
    // no tests so remove cookies
    console.log("No active tests. Remove???");
    remove = true;
    createABTest = false;
  }
​
  // TEST calling EXTERNAL source
  let preflightResp = await fetch(
    "https://httpbin.org/response-headers?Flags=test-A,test-B",
    { backend: "extern" }
  );
​
  // Avoid making changes to the original Request object.
  // It's usually better to clone and create a new object.
  //req.headers.set('flags', preflightResp.headers.get('flags'));
  console.log("preflightResp = " + preflightResp);
  
  // set ab tests on header fro origin
  req.headers.set("fab", abTestValue);
  req.headers.set("fabvh", varyHeaderValue);
  
  // set to get out of loop
  req.headers.set("abprocessed", "true");
​
  // set for origin
  if (createABTest){
    console.log("Create ABTest Value= " + abTestValue);
  }
​
  // call the backend
  let backendResponse = await fetch(req, {
    backend: "abtestentryvcl",
  });
​
  console.log("backend status = " + backendResponse.status);
​
  // set ab test for response - cache 
  backendResponse.headers.set("fab", abTestValue);
  backendResponse.headers.set("fabvh", varyHeaderValue);
  backendResponse.headers.set("VARY", "fabvh");
  backendResponse.headers.set("Surrogate-Key", "fastly-ab-test");
​
  backendResponse.headers.set('flags', preflightResp.headers.get('flags'));
  
  return backendResponse;  
}
​
function isUserElibleForTest(req, config){
  var isUserElibleForTest = true;
  
  let testConfigObj = JSON.parse(config);
  if (testConfigObj.domain){
    let url = new URL(req.url);
​
    //console.log("X-Forwarded-Host=" + req.headers.get("X-Forwarded-Host"), + ", params=" + url.search);
​
    let forwardHost = req.headers.get("X-Forwarded-Host");
​
    if (forwardHost != null && forwardHost.toString() != testConfigObj.domain.toString()){
      console.log('host not match');
      isUserElibleForTest = false;
    }
    
    if (url.search.includes(testConfigObj.exclusionParam))
    {
      console.log('exclusionParam found');
      isUserElibleForTest = false; 
    }
  } 
  //console.log("domain=" + testConfigObj.domain + ", exclusionParam=" + testConfigObj.exclusionParam + ", isUserElibleForTest=" + isUserElibleForTest);
​
  return isUserElibleForTest;
}
​
const parseCookies = headerString => Object.fromEntries(
  (headerString || '')
    .split('; ')
    .map(entry => entry.split('=', 2))
);
​
function getABTestValue(config){
  let testConfigObj = JSON.parse(config);
  
  let bucketsArray = testConfigObj.buckets.toString().split(",");
  let weightsArray = testConfigObj.weight.toString().split(":").map((e) => parseInt(e));;
  
  return getWeightedBucketValue(bucketsArray, weightsArray);
}
​
function getWeightedBucketValue(items, weights) {
  var i;
  
  for (i = 0; i < weights.length; i++){
      weights[i] += weights[i - 1] || 0;
  }
​
  var random = Math.random() * weights[weights.length - 1];
  
  for (i = 0; i < weights.length; i++)
      if (weights[i] > random)
          break;
  
  return items[i];
}









