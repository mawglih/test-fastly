/// <reference types="@fastly/js-compute" />
import myPage2 from './my-page2.html';

const handler = async (event) => {
    // Get the client request.
   // function to call maxymizer 
  const req = event.request;
  let userAgent = req.headers.get('User-Agent');
  if (!userAgent) {
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
  }

  async function fetchMyABtest(state) {
    console.log('fetchMyABtest executed');
    const data = {
      url: "https://www.1800flowers.com/home",
      ipAddress: "91.189.59.122",
      visitorState: ""
    }
    const url = 'https://api.maxymiser.net/us/sandbox/v1/sites/MDAwNDk3/generations';
    const options = {
      backend: 'maxymizer',
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent
      }
    };
    let visitorState = '';
    let experience = {};
    let response = {};
    const fetchResponse = await fetch(url, options);
    const res = await fetchResponse.json();
    visitorState = res.visitorState;
    console.log('visitorState: ' +  visitorState);
    experience = res.generations[0].experience;
    console.log('homepage: ' + experience.homepage);
    response = {visitorState, experience}
    console.log(response);
    return response;
  };

  // fastly handler
  const preflightResp = await fetchMyABtest();
  console.log('preflightresponse: ');
  console.log(preflightResp);
  // const indx = preflightResp.indexOf('visitorState');
  // const stateStr = preflightResp.substring(indx).split(':')[1];
  // const state = stateStr.substring(1, stateStr.length - 2);
  // console.log('state: ' + state);

  // set cookie visitorState

  // if(state) {
  //   const resp = await fetchMyABtest(state);
  //   console.log('resp: ');
  //   console.log(resp);
  // }

  // get existing values from cookie if exists
  if (req.headers.has('Cookie')) {
    let cookies = parseCookies(req.headers.get('Cookie'));
    if (cookies['visitorState']){
      abTestCookieExistingValue = cookies['visitorState'];
      abTestValue = abTestCookieExistingValue;
      console.log("ABTest Cookie Already Set. Value= " + abTestCookieExistingValue);
      createABTest = false;
      fetchMyABtest(abTestValue);
    }
  }

  console.log('this is version 67');


 

  // Filter requests that have unexpected methods.
  if (!["HEAD", "GET"].includes(req.method)) {
    return new Response("This method is not allowed", {
      status: 405,
    });
  }
  let url = new URL(req.url);
  if(url.pathname == "/") {
      return new Response(myPage2, {
      status: 200,
      headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
    });
    
  }
};

addEventListener('fetch', event => event.respondWith(handler(event)));