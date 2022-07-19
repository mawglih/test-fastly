const fetchMyABtest = async () => {
  const options = {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "User-Agent": navigator.userAgent
  }};
  const body = 
    JSON.stringify({
      "url": "https://1800flower.com/home",
      "ipAddress": "92.253.204.83",
      "visitorState": ""
    });

  const url = 'https://api.maxymiser.net/us/sandbox/v1/sites/MDAwNDk3/generations';
  const fetchResponse = await fetch(url, options, body)
  const response =  await fetchResponse.json();
  console.log(response);
  return response;
}

const handler = async (event) => {
  console.log('here is a handler, version 20');
  let preflightResp = await fetchMyABtest();

  // Avoid making changes to the original Request object.
  // It's usually better to clone and create a new object.
  const originalReq = event.request;
  const newReq = new Request(originalReq);
  newReq.headers.set('flags', preflightResp.headers.get('flags'));

  const clientResponse = await fetch(newReq, { backend: "origin_1" });
  return clientResponse;
};

addEventListener('fetch', event => event.respondWith(handler(event)));