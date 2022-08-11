async function main(){
  const userAgent = navigator.userAgent;
  console.log(userAgent);
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
  console.log(fetchResponse);
  const res = await fetchResponse.json();
  console.log(res);
  visitorState = res.visitorState;
  experience = res.generations[0].experience;
  response = {visitorState, experience}
  console.log(response);
  return response;
  };


main();