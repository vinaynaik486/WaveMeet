const initJitsi = user => {
  if (!window.JitsiMeetExternalAPI) {
    console.error("JitsiMeetExternalAPI is not loaded");
    return;
  }

  const domain = "meet.jit.si";
  const options = {
    roomName: "YourMeetingRoom",
    width: "100%",
    height: "100%",
    parentNode: document.getElementById("jitsi-container"),
    userInfo: {
      displayName: user?.name || "Guest",
    },
  };

  new window.JitsiMeetExternalAPI(domain, options);
};

export default initJitsi;
